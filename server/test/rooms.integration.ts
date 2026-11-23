import "reflect-metadata";
import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { createServer } from "node:http";
import * as Y from "yjs";
import { WorkerBridge } from "../src/realtime/worker-bridge.service";
import { testApp, once, until } from "./helpers/app-fixture";

test("feature modules preserve room data, realtime delivery and AI lifecycle", async (t) => {
  const f = await testApp();
  let cloudCalls = 0;
  const cloud = createServer(async (req, res) => {
    for await (const _ of req) {
    }
    cloudCalls++;
    res.setHeader("Content-Type", "application/json");
    res.end(
      JSON.stringify({
        choices: [{ message: { content: "Cloud fallback answer" } }],
      }),
    );
  });
  await new Promise<void>((resolve) => cloud.listen(0, "127.0.0.1", resolve));
  process.env.YANDEX_API_URL = `http://127.0.0.1:${(cloud.address() as { port: number }).port}`;
  try {
    const owner = await f.login(true),
      guest = await f.login();
    const room = await f.room(owner),
      other = await f.room(owner);
    await f.db.sessionProposal.create({
      data: {
        listingId: room.slice(8),
        senderId: guest.data.id,
        ownerId: owner.data.id,
        senderName: guest.data.name,
        status: "accepted",
      },
    });
    const client = f.socket(guest.cookie, room),
      ready = once(client, "room:ready");
    client.connect();
    await ready;
    await t.test(
      "duplicate message acknowledgements and paginated history",
      async () => {
        const body = { clientRequestId: randomUUID(), text: "Shared message" };
        const send = () =>
          new Promise<any>((resolve, reject) =>
            client
              .timeout(3000)
              .emit("message:send", body, (e: Error | null, v: unknown) =>
                e ? reject(e) : resolve(v),
              ),
          );
        const a = await send(),
          b = await send();
        assert.equal(a.ok, true);
        assert.equal(a.message.id, b.message.id);
        await f.db.message.createMany({
          data: Array.from({ length: 55 }, (_, i) => ({
            roomId: room,
            author: "Fixture",
            text: "History " + i,
            clientRequestId: randomUUID(),
          })),
        });
        const latest = await f.api(`/rooms/${room}/messages`, guest.cookie);
        assert.equal(latest.status, 200);
        assert.equal(latest.data.messages.length, 50);
        assert.equal(latest.data.hasOlder, true);
        const older = await f.api(
          `/rooms/${room}/messages?before=${latest.data.messages[0].seq}`,
          guest.cookie,
        );
        assert.equal(older.data.messages.length, 6);
        assert.equal(
          (await f.api(`/rooms/${other}/messages`, guest.cookie)).status,
          403,
        );
      },
    );
    await t.test(
      "replies are room scoped and only the sender can delete a message",
      async () => {
        const send = (text: string, targetMessageId?: string) =>
          client.timeout(3000).emitWithAck("message:send", {
            clientRequestId: randomUUID(),
            text,
            targetMessageId,
          });
        const original = (await send("Original")).message;
        const reply = await send("Reply", original.id);
        assert.equal(reply.message.targetMessageId, original.id);
        const foreign = await f.db.message.create({
          data: {
            roomId: other,
            author: "Fixture",
            text: "Private",
            clientRequestId: randomUUID(),
          },
        });
        assert.equal(
          (await send("Invalid quote", foreign.id)).code,
          "MESSAGE_NOT_FOUND",
        );
        const remove = (cookie: string) =>
          fetch(f.base + `/api/rooms/${room}/messages/${original.id}`, {
            method: "DELETE",
            headers: { Cookie: cookie },
          });
        assert.equal((await remove(owner.cookie)).status, 403);
        const updated = once(client, "message:updated");
        assert.equal((await remove(guest.cookie)).status, 200);
        await updated;
        const catchup = await f.api(
          `/rooms/${room}/messages?after=${reply.message.seq}`,
          guest.cookie,
        );
        assert.ok(catchup.data.deletedIds.includes(original.id));
        const history = await f.api(`/rooms/${room}/messages`, guest.cookie);
        assert.equal(
          history.data.messages.find(
            (m: { id: string }) => m.id === original.id,
          ).text,
          "",
        );
      },
    );
    let worker = f.socket("", undefined, true);
    const online = once(worker, "worker:ready");
    worker.connect();
    await online;
    const ask = (roomId: string) =>
      f.api(`/rooms/${roomId}/ai/requests`, owner.cookie, {
        clientRequestId: randomUUID(),
        prompt: "Explain this quotation",
        locale: "en",
      });
    const settled = async (id: string) => {
      await until(
        async () =>
          !["running", "pending"].includes(
            (await f.db.aiJob.findUniqueOrThrow({ where: { id } })).status,
          ),
      );
      return f.db.aiJob.findUniqueOrThrow({ where: { id } });
    };
    await t.test("Neuron saves a batch of tools in the requesting room", async () => {
      const toolsRoom = await f.room(owner);
      const viewer = f.socket(owner.cookie, toolsRoom);
      const ready = once(viewer, "room:ready");
      viewer.connect();
      await ready;
      const changed = once(viewer, "tools:changed");
      worker.once("worker:job", ({ id }) => {
        const actions = [
          { type: "create_task", title: "Read chapter 2" },
          { type: "create_note", title: "Reading", body: "Start at page 12" },
          { type: "timer", action: "start" },
        ];
        worker.emit("worker:result", {
          id,
          text: "PAIRUP_ACTIONS\n" + JSON.stringify(actions),
        });
      });
      const path = `/rooms/${toolsRoom}`;
      const response = await f.api(`${path}/ai/requests`, owner.cookie, {
        clientRequestId: randomUUID(),
        prompt: "Add a task to read chapter 2, save a note titled Reading with the text Start at page 12, and start the timer.",
        locale: "en",
      });
      assert.equal(response.status, 201);
      assert.equal((await changed).roomId, toolsRoom);
      assert.equal((await settled(response.data.id)).status, "completed");
      const snapshot = (await f.api(`${path}/tools`, owner.cookie)).data;
      assert.deepEqual(snapshot.tasks.map(({ title }: { title: string }) => title), ["Read chapter 2"]);
      assert.equal(snapshot.notes.length, 1);
      assert.equal(snapshot.notes[0].title, "Reading");
      const note = (await f.api(`${path}/tools/notes/${snapshot.notes[0].id}`, owner.cookie)).data;
      const doc = new Y.Doc();
      try {
        Y.applyUpdate(doc, Buffer.from(note.state, "base64"));
        assert.equal(doc.getText("body").toString(), "Start at page 12");
      } finally {
        doc.destroy();
      }
      const timer = (await f.api(`${path}/tools/timer`, owner.cookie)).data;
      assert.ok(new Date(timer.endsAt).getTime() > timer.serverNow);
      assert.equal(await f.db.studyTask.count({ where: { roomId: other } }), 0);
      const answer = await f.db.message.findUniqueOrThrow({
        where: { clientRequestId: "job-answer:" + response.data.id },
      });
      assert.equal(answer.text, "Created task “Read chapter 2”.\nCreated note “Reading”.\nStarted the timer.");
    });
    await t.test(
      "local worker context, idempotent AI requests and one final answer",
      async () => {
        const first = await f.db.message.findFirstOrThrow({
          where: { roomId: room },
          orderBy: { seq: "asc" },
        });
        let captured: any;
        worker.on("worker:job", (job) => {
          captured = job;
          worker.emit("worker:result", { id: job.id, text: "Local answer" });
        });
        const body = {
          clientRequestId: randomUUID(),
          prompt: "Translate the selected message",
          locale: "ru",
          targetMessageId: first.id,
        };
        const a = await f.api(`/rooms/${room}/ai/requests`, guest.cookie, body),
          b = await f.api(`/rooms/${room}/ai/requests`, guest.cookie, body);
        assert.equal(a.status, 201);
        assert.equal(a.data.id, b.data.id);
        const result = await settled(a.data.id);
        assert.equal(result.provider, "local");
        assert.equal(result.status, "completed");
        assert.equal(captured.messages.at(-1).content, body.prompt);
        assert.ok(captured.messages[1].content.includes("Shared message"));
        assert.ok(!captured.messages[1].content.includes("History 54"));
        assert.equal(
          await f.db.message.count({ where: { roomId: room, kind: "ai" } }),
          1,
        );
      },
    );
    await t.test(
      "local timeout falls back to cloud and ignores a late worker result",
      async () => {
        await f.db.aiJob.updateMany({
          where: { roomId: room },
          data: { createdAt: new Date(Date.now() - 20000) },
        });
        worker.removeAllListeners("worker:job");
        let pending: any;
        worker.once("worker:job", (job) => {
          pending = job;
        });
        const a = await ask(room);
        assert.equal(a.status, 201);
        const result = await settled(a.data.id);
        assert.equal(result.provider, "cloud");
        assert.equal(cloudCalls, 1);
        worker.emit("worker:result", {
          id: pending.id,
          text: "Late local answer",
        });
        await new Promise((r) => setTimeout(r, 60));
        assert.equal(
          await f.db.message.count({
            where: { clientRequestId: "job-answer:" + a.data.id },
          }),
          1,
        );
      },
    );
    await t.test(
      "worker disconnection falls back without losing chat access",
      async () => {
        await f.db.aiJob.updateMany({
          where: { roomId: room },
          data: { createdAt: new Date(Date.now() - 20000) },
        });
        const pending = once(worker, "worker:job");
        const request = await ask(room);
        await pending;
        worker.disconnect();
        const result = await settled(request.data.id);
        assert.equal(result.provider, "cloud");
        assert.equal(cloudCalls, 2);
        await until(() => !f.app.get(WorkerBridge).connected);
        assert.equal(
          (await f.api(`/rooms/${room}/messages`, guest.cookie)).status,
          200,
        );

        const invalid = f.socket("", undefined, true);
        invalid.auth = { kind: "worker", secret: "invalid-worker-secret" };
        const rejected = once(invalid, "disconnect");
        invalid.connect();
        await rejected;
        assert.equal(f.app.get(WorkerBridge).connected, false);

        worker = f.socket("", undefined, true);
        const ready = once(worker, "worker:ready");
        worker.connect();
        await ready;
      },
    );
    await t.test(
      "clearing only the fixture room cancels its pending AI job",
      async () => {
        const pending = once(worker, "worker:job");
        const a = await ask(other);
        assert.equal(a.status, 201);
        await pending;
        const cancelled = once(worker, "worker:cancel");
        assert.equal(
          (await f.api(`/rooms/${other}/reset`, owner.cookie, {})).status,
          201,
        );
        assert.equal((await cancelled).id, a.data.id);
        worker.emit("worker:result", {
          id: a.data.id,
          text: "Answer after cancellation",
        });
        await until(
          async () =>
            (await f.db.aiJob.findUniqueOrThrow({ where: { id: a.data.id } }))
              .status === "cancelled",
        );
        assert.equal(await f.db.message.count({ where: { roomId: other } }), 0);
      },
    );
    await t.test(
      "notes, tasks, timer, board, profile and voice route providers are wired",
      async () => {
        const path = `/rooms/${room}/tools`;
        const noteId = randomUUID(),
          taskId = randomUUID();
        assert.equal(
          (await f.api(path + "/notes", guest.cookie, { id: noteId })).status,
          201,
        );
        const doc = new Y.Doc();
        doc.getText("title").insert(0, "Shared note");
        doc.getText("body").insert(0, "Useful phrases");
        assert.equal(
          (
            await f.api(path + `/notes/${noteId}`, guest.cookie, {
              state: Buffer.from(Y.encodeStateAsUpdate(doc)).toString("base64"),
            })
          ).status,
          201,
        );
        doc.destroy();
        assert.equal(
          (
            await f.api(path + "/tasks", guest.cookie, {
              id: taskId,
              title: "Review",
            })
          ).status,
          201,
        );
        assert.equal(
          (
            await f.api(path + `/tasks/${taskId}`, guest.cookie, {
              version: 0,
              completed: true,
            })
          ).status,
          201,
        );
        const state = await f.api(path, guest.cookie);
        assert.equal(state.data.notes[0].title, "Shared note");
        assert.equal(state.data.tasks[0].completed, true);
        const timer = await f.api(path + "/timer", guest.cookie);
        assert.equal(
          (
            await f.api(path + "/timer", guest.cookie, {
              version: timer.data.version,
              action: "start",
            })
          ).status,
          201,
        );
        const board = await f.api(path + "/board", guest.cookie);
        const changed = await f.api(path + "/board", guest.cookie, {
          generation: board.data.generation,
          action: "add",
          element: {
            id: randomUUID(),
            kind: "square",
            color: "#000000",
            width: 2,
            points: [
              [10, 10],
              [110, 70],
            ],
          },
        });
        assert.equal(changed.status, 201, JSON.stringify(changed.data));
        const profile = await f.api("/me/profile", guest.cookie);
        assert.equal(profile.status, 200);
        assert.equal((await f.api("/profiles/" + profile.data.id)).status, 200);
        assert.equal(
          (await f.api(`/rooms/${room}/voice/token`, guest.cookie, {})).status,
          201,
        );
      },
    );
    await t.test(
      "files appear in chat and are downloadable only by participants",
      async () => {
        const form = new FormData();
        form.set("clientRequestId", randomUUID());
        form.set(
          "file",
          new Blob(["Study plan"], { type: "text/plain" }),
          "study-plan.txt",
        );
        const response = await fetch(f.base + `/api/rooms/${room}/files`, {
          method: "POST",
          headers: { Cookie: guest.cookie },
          body: form,
        });
        const file = await response.json();
        assert.equal(response.status, 201, JSON.stringify(file));
        assert.equal(
          (await f.api(`/rooms/${room}/files`, guest.cookie)).data.length,
          1,
        );
        const content = await fetch(
          f.base + `/api/rooms/${room}/files/${file.attachment.id}/content`,
          { headers: { Cookie: guest.cookie } },
        );
        assert.equal(await content.text(), "Study plan");
        assert.equal(
          (
            await fetch(
              f.base + `/api/rooms/${room}/files/${file.attachment.id}/content`,
            )
          ).status,
          401,
        );
      },
    );
  } finally {
    await f.close();
    cloud.closeAllConnections();
    await new Promise<void>((resolve) => cloud.close(() => resolve()));
  }
});
