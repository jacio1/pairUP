import "reflect-metadata";
import { test } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { execFileSync, spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { io, type Socket } from "socket.io-client";

const database = process.env.TEST_DATABASE_URL;
if (!database || !new URL(database).pathname.includes("test"))
  throw new Error(
    "Set TEST_DATABASE_URL to a dedicated PostgreSQL database whose name contains test. Never use production data.",
  );
process.env.DATABASE_URL = database;
process.env.PRESENTER_PASSWORD = "integration-presenter-secret";
process.env.WORKER_SECRET = "integration-worker-secret";
process.env.PUBLIC_ORIGIN = "http://localhost:3000";
process.env.LOCAL_TIMEOUT_MS = "150";
process.env.YANDEX_API_KEY = "fake-integration-key";
process.env.YANDEX_MODEL = "fake-integration-model";
execFileSync(
  process.execPath,
  ["node_modules/prisma/build/index.js", "migrate", "deploy"],
  { env: process.env, stdio: "pipe" },
);

test("sessions, realtime delivery, context, AI fallback, reset and recovery", async (t) => {
  const { NestFactory } = await import("@nestjs/core");
  const { AppModule, Database } = await import("../src/app");
  let app = await NestFactory.create(AppModule, { logger: false });
  await app.listen(0, "127.0.0.1");
  let base = await app.getUrl();
  let db = app.get(Database);
  const sockets: Socket[] = [];
  let cloudCalls = 0;
  let cloudOk = true;
  let cloudBody: { messages?: { content: string }[] } = {};
  const cloud = createServer(async (req, res) => {
    let body = "";
    for await (const chunk of req) body += chunk;
    cloudBody = JSON.parse(body);
    cloudCalls++;
    res.writeHead(cloudOk ? 200 : 503, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        choices: [{ message: { content: "Cloud translation" } }],
      }),
    );
  });
  await new Promise<void>((resolve) => cloud.listen(0, "127.0.0.1", resolve));
  process.env.YANDEX_API_URL = `http://127.0.0.1:${(cloud.address() as { port: number }).port}/v1/chat/completions`;
  const request = async (path: string, cookie = "", body?: unknown) => {
    const response = await fetch(`${base}/api${path}`, {
      method: body === undefined ? "GET" : "POST",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    return {
      status: response.status,
      data: await response.json(),
      cookie: response.headers.get("set-cookie")?.split(";")[0] || "",
    };
  };
  const connect = async (cookie = "", worker = false) => {
    const socket = io(base, {
      autoConnect: false,
      transports: ["websocket"],
      extraHeaders: { Cookie: cookie },
      auth: worker ? { kind: "worker", secret: process.env.WORKER_SECRET } : {},
    });
    sockets.push(socket);
    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error("socket timeout")), 4000);
      socket.once(worker ? "worker:ready" : "room:ready", () => {
        clearTimeout(timer);
        resolve();
      });
      socket.connect();
    });
    return socket;
  };
  const send = (socket: Socket, data: unknown) =>
    new Promise<any>((resolve, reject) =>
      socket
        .timeout(3000)
        .emit("message:send", data, (err: Error | null, result: unknown) =>
          err ? reject(err) : resolve(result),
        ),
    );
  const completed = async (id: string) => {
    for (let i = 0; i < 100; i++) {
      const job = await db.aiJob.findUniqueOrThrow({ where: { id } });
      if (!["running", "pending"].includes(job.status)) return job;
      await new Promise((r) => setTimeout(r, 20));
    }
    throw new Error("AI did not settle");
  };
  const unlockAi = () =>
    db.aiJob.updateMany({ data: { createdAt: new Date(Date.now() - 20000) } });
  try {
    const presenter = await request("/auth/presenter", "", {
      password: process.env.PRESENTER_PASSWORD,
    });
    const guest = await request("/auth/demo", "", {});
    const second = await request("/auth/demo", "", {});
    await t.test("guest sessions and presenter permissions", async () => {
      assert.notEqual(guest.data.id, second.data.id);
      assert.equal(guest.data.role, "guest");
      assert.equal(presenter.data.role, "presenter");
      assert.equal((await request("/me", guest.cookie)).data.id, guest.data.id);
      assert.equal(
        (await request("/auth/demo", guest.cookie, {})).data.id,
        guest.data.id,
      );
      assert.equal(
        (await request("/auth/presenter", "", { password: "wrong" })).status,
        401,
      );
      assert.equal((await request("/rooms/demo/messages")).status, 401);
      assert.equal(
        (await request("/rooms/demo/reset", guest.cookie, {})).status,
        403,
      );
      assert.equal(
        (await request("/rooms/demo/ai/requests", guest.cookie, {})).status,
        403,
      );
    });
    await request("/rooms/demo/reset", presenter.cookie, {});
    const a = await connect(guest.cookie);
    const b = await connect(second.cookie);
    const id = randomUUID();
    let received = 0;
    b.on("message:created", () => received++);
    await t.test(
      "persist before ack, broadcast, deduplication and rate limits",
      async () => {
        const first = await send(a, {
          clientRequestId: id,
          text: "Hello from the study group",
        });
        assert.equal(first.ok, true);
        const duplicate = await send(a, {
          clientRequestId: id,
          text: "Hello from the study group",
        });
        assert.equal(duplicate.message.id, first.message.id);
        assert.equal(
          await db.message.count({ where: { id: first.message.id } }),
          1,
        );
        await new Promise((r) => setTimeout(r, 40));
        assert.equal(received, 1);
        assert.equal(
          (
            await send(a, {
              clientRequestId: randomUUID(),
              text: "x".repeat(1001),
            })
          ).code,
          "INVALID_INPUT",
        );
        for (let i = 0; i < 4; i++)
          assert.equal(
            (
              await send(a, {
                clientRequestId: randomUUID(),
                text: `Note ${i}`,
              })
            ).ok,
            true,
          );
        assert.equal(
          (await send(a, { clientRequestId: randomUUID(), text: "too fast" }))
            .code,
          "RATE_LIMIT",
        );
      },
    );
    let captured: any;
    const worker = await connect("", true);
    worker.on("worker:job", (job) => {
      captured = job;
      worker.emit("worker:result", { id: job.id, text: "Локальный перевод" });
      worker.emit("worker:result", { id: job.id, text: "Duplicate answer" });
    });
    await t.test(
      "local AI, language instruction, selected context and exactly one answer",
      async () => {
        const target = (await request("/rooms/demo/messages", guest.cookie))
          .data.messages[0];
        const body = {
          clientRequestId: randomUUID(),
          prompt: "Translate into Russian",
          locale: "en",
          targetMessageId: target.id,
        };
        const result = await request(
          "/rooms/demo/ai/requests",
          presenter.cookie,
          body,
        );
        assert.equal(result.status, 201);
        assert.equal((await completed(result.data.id)).provider, "local");
        assert.match(
          captured.messages[1].content,
          /Hello from the study group/,
        );
        assert.doesNotMatch(captured.messages[1].content, /Note 3/);
        assert.match(captured.messages[0].content, /English/);
        assert.match(captured.messages[2].content, /Translate into Russian/);
        assert.equal(
          await db.message.count({
            where: { clientRequestId: `job-answer:${result.data.id}` },
          }),
          1,
        );
        assert.equal(
          (await request("/rooms/demo/ai/requests", presenter.cookie, body))
            .data.id,
          result.data.id,
        );
        assert.equal(cloudCalls, 0);
      },
    );
    worker.removeAllListeners("worker:job");
    await unlockAi();
    await t.test(
      "local timeout switches to cloud and ignores late result",
      async () => {
        const result = await request(
          "/rooms/demo/ai/requests",
          presenter.cookie,
          { clientRequestId: randomUUID(), prompt: "Summarize", locale: "ru" },
        );
        assert.equal((await completed(result.data.id)).provider, "cloud");
        assert.equal(cloudCalls, 1);
        assert.match(cloudBody.messages![0].content, /Russian/);
        worker.emit("worker:result", {
          id: result.data.id,
          text: "Late duplicate",
        });
        await new Promise((r) => setTimeout(r, 40));
        assert.equal(
          await db.message.count({
            where: { clientRequestId: `job-answer:${result.data.id}` },
          }),
          1,
        );
      },
    );
    worker.disconnect();
    cloudOk = false;
    await unlockAi();
    await t.test("both providers fail without losing chat", async () => {
      const result = await request(
        "/rooms/demo/ai/requests",
        presenter.cookie,
        { clientRequestId: randomUUID(), prompt: "Explain", locale: "ru" },
      );
      assert.equal((await completed(result.data.id)).status, "failed");
      assert.ok(
        (await request("/rooms/demo/messages", guest.cookie)).data.messages
          .length > 0,
      );
      assert.equal(
        (
          await send(b, {
            clientRequestId: randomUUID(),
            text: "Chat still works",
          })
        ).ok,
        true,
      );
    });
    await t.test(
      "reset clears shared history and invalidates in-flight jobs",
      async () => {
        await unlockAi();
        const w = await connect("", true);
        w.on("worker:job", () => {});
        const result = await request(
          "/rooms/demo/ai/requests",
          presenter.cookie,
          {
            clientRequestId: randomUUID(),
            prompt: "Explain again",
            locale: "en",
          },
        );
        const before = (await request("/rooms/demo/messages", guest.cookie))
          .data.generation;
        await request("/rooms/demo/reset", presenter.cookie, {});
        const after = (await request("/rooms/demo/messages", guest.cookie))
          .data;
        assert.equal(after.messages.length, 0);
        assert.equal(after.generation, before + 1);
        w.emit("worker:result", { id: result.data.id, text: "Stale result" });
        assert.equal((await completed(result.data.id)).status, "cancelled");
        assert.equal(
          (await request("/rooms/demo/messages", guest.cookie)).data.messages
            .length,
          0,
        );
      },
    );
    await t.test(
      "server restart retains sessions/history and marks interrupted AI",
      async () => {
        const message = await send(b, {
          clientRequestId: randomUUID(),
          text: "Persist across restart",
        });
        assert.equal(message.ok, true);
        const room = await db.room.findUniqueOrThrow({ where: { id: "demo" } });
        const interrupted = await db.aiJob.create({
          data: {
            roomId: "demo",
            clientRequestId: randomUUID(),
            prompt: "Interrupted request",
            locale: "en",
            generation: room.generation,
            status: "running",
          },
        });
        sockets.forEach((socket) => socket.disconnect());
        await app.close();
        app = await NestFactory.create(AppModule, { logger: false });
        await app.listen(0, "127.0.0.1");
        base = await app.getUrl();
        db = app.get(Database);
        assert.equal(
          (await request("/me", guest.cookie)).data.id,
          guest.data.id,
        );
        const snapshot = (await request("/rooms/demo/messages", guest.cookie))
          .data;
        assert.ok(
          snapshot.messages.some(
            (m: { id: string }) => m.id === message.message.id,
          ),
        );
        assert.equal(snapshot.ai.id, interrupted.id);
        assert.equal(snapshot.ai.status, "failed");
        assert.equal(snapshot.ai.error, "AI_INTERRUPTED");
      },
    );
    await t.test(
      "the production worker calls Ollama with the configured model and returns its answer",
      async () => {
        let payload: {
          model?: string;
          think?: boolean;
          options?: { num_ctx: number };
        } = {};
        const ollama = createServer(async (req, res) => {
          let raw = "";
          for await (const chunk of req) raw += chunk;
          payload = JSON.parse(raw);
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(
            JSON.stringify({
              message: { content: "Answer from the Ollama test fixture" },
            }),
          );
        });
        await new Promise<void>((resolve) =>
          ollama.listen(0, "127.0.0.1", resolve),
        );
        const child = spawn(process.execPath, ["../worker/index.mjs"], {
          env: {
            ...process.env,
            SERVER_URL: base,
            OLLAMA_URL: `http://127.0.0.1:${(ollama.address() as { port: number }).port}`,
            OLLAMA_MODEL: "qwen3:8b",
          },
          stdio: ["ignore", "pipe", "pipe"],
        });
        try {
          await new Promise<void>((resolve, reject) => {
            const timer = setTimeout(
              () => reject(new Error("worker startup timeout")),
              5000,
            );
            child.stdout.on("data", (chunk) => {
              if (chunk.toString().includes("worker ready")) {
                clearTimeout(timer);
                resolve();
              }
            });
            child.once("error", (error) => {
              clearTimeout(timer);
              reject(error);
            });
          });
          await unlockAi();
          const result = await request(
            "/rooms/demo/ai/requests",
            presenter.cookie,
            {
              clientRequestId: randomUUID(),
              prompt: "Explain the discussion",
              locale: "en",
            },
          );
          assert.equal((await completed(result.data.id)).provider, "local");
          assert.equal(payload.model, "qwen3:8b");
          assert.equal(payload.think, false);
          assert.equal(payload.options?.num_ctx, 8192);
          const answer = await db.message.findUniqueOrThrow({
            where: { clientRequestId: `job-answer:${result.data.id}` },
          });
          assert.equal(answer.text, "Answer from the Ollama test fixture");
        } finally {
          const exited = new Promise((resolve) => child.once("exit", resolve));
          child.kill();
          await exited;
          await new Promise<void>((resolve) => ollama.close(() => resolve()));
        }
      },
    );
  } finally {
    sockets.forEach((socket) => socket.disconnect());
    await new Promise<void>((resolve) => cloud.close(() => resolve()));
    await app.close();
  }
});
