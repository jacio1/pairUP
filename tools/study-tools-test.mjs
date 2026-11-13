import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
const require = createRequire(
  new URL("../server/package.json", import.meta.url),
);
require("dotenv").config({
  path: fileURLToPath(new URL("../server/.env", import.meta.url)),
  quiet: true,
});
const { PrismaClient } = require("@prisma/client");
const Y = require("yjs");
const en = require("../client/messages/en.json"),
  ru = require("../client/messages/ru.json");
const db = new PrismaClient();
const browser = await chromium.launch({ channel: "msedge", headless: true });
const a = await browser.newContext({
  locale: "en-US",
  viewport: { width: 1440, height: 1000 },
});
const b = await browser.newContext({
  locale: "ru-RU",
  viewport: { width: 390, height: 844 },
});
const stranger = await browser.newContext(),
  anonymous = await browser.newContext();
const sessions = [],
  listings = [],
  rooms = [];
const base = "http://localhost:3000";
const request = (context, path, body) =>
  body === undefined
    ? context.request.get(`${base}/api${path}`)
    : context.request.post(`${base}/api${path}`, { data: body });
const check = async (response, status = 201) => {
  assert.equal(response.status(), status, await response.text());
  return response.json();
};
async function login(context) {
  const s = await check(await request(context, "/auth/demo", {}));
  sessions.push(s.id);
  return s;
}
async function listing(context) {
  const id = crypto.randomUUID();
  listings.push(id);
  rooms.push(`listing-${id}`);
  return check(
    await request(context, "/listings", {
      id,
      title: "Study tools integration",
      description: "An isolated session used only by automated checks.",
      subject: "computerScience",
      level: "intermediate",
      goal: "Check collaborative tools",
      format: "online",
      schedule: "",
      location: "",
      authorName: "Tools test",
    }),
  );
}
async function value(page, field, text) {
  await page.waitForFunction(
    ({ id, text }) => document.getElementById(id)?.value === text,
    { id: await field.getAttribute("id"), text },
    { timeout: 20000 },
  );
}
const errors = [];
try {
  await login(a);
  await login(b);
  await login(stranger);
  const room = await listing(a),
    other = await listing(a);
  const prefix = `/rooms/${room.roomId}/tools`;
  assert.equal((await request(anonymous, prefix)).status(), 401);
  assert.equal((await request(stranger, prefix)).status(), 403);
  const proposal = await check(
    await request(b, `/listings/${room.id}/proposals`, {}),
  );
  await check(
    await request(a, `/proposals/${proposal.id}/respond`, { accept: true }),
  );
  const pa = await a.newPage(),
    pb = await b.newPage();
  for (const p of [pa, pb])
    p.on("pageerror", (error) => errors.push(error.message));
  await Promise.all([
    pa.goto(`${base}/messages/${room.roomId}`),
    pb.goto(`${base}/messages/${room.roomId}`),
  ]);
  await pa.getByRole("tab", { name: en.Room.notes, exact: true }).click();
  await pb.getByRole("tab", { name: ru.Room.notes, exact: true }).click();
  await pa
    .getByRole("button", { name: en.StudyTools.newNote, exact: true })
    .click();
  const titleA = pa.getByLabel(en.StudyTools.noteTitle, { exact: true });
  const bodyA = pa.getByRole("textbox", {
    name: en.StudyTools.noteBody,
    exact: true,
  });
  const bodyB = pb.getByRole("textbox", {
    name: ru.StudyTools.noteBody,
    exact: true,
  });
  await titleA.fill("Shared research notes");
  await bodyA.fill("We learn together");
  await value(pb, bodyB, "We learn together");
  await Promise.all([
    bodyA.fill("We learn together from Alice"),
    bodyB.fill("Bob: We learn together"),
  ]);
  await value(pa, bodyA, "Bob: We learn together from Alice");
  await value(pb, bodyB, "Bob: We learn together from Alice");
  let snapshot = await check(await request(a, prefix), 200);
  const noteId = snapshot.notes[0].id;
  assert.equal(
    (await request(a, `/rooms/${other.roomId}/tools/notes/${noteId}`)).status(),
    404,
  );
  assert.equal(
    (await request(b, `/rooms/${other.roomId}/tools`)).status(),
    403,
  );
  assert.equal(
    (
      await request(stranger, `${prefix}/notes/${noteId}`, { state: "AA==" })
    ).status(),
    403,
  );
  const downloadPromise = pa.waitForEvent("download");
  await pa.getByRole("button", { name: en.StudyTools.exportNote }).click();
  assert.equal(
    (await downloadPromise).suggestedFilename(),
    "Shared research notes.txt",
  );
  await pa.route("**/tools/notes/*", (route) =>
    route.request().method() === "POST" ? route.abort() : route.continue(),
  );
  await bodyA.fill("Bob: We learn together from Alice offline");
  await pa
    .getByRole("alert")
    .filter({ hasText: en.StudyTools.SERVER_ERROR })
    .waitFor();
  await bodyB.fill("Bob: We learn together from Alice + online");
  await pa.getByRole("tab", { name: en.Room.tasks, exact: true }).click();
  await pa.unroute("**/tools/notes/*");
  await pa.getByRole("tab", { name: en.Room.notes, exact: true }).click();
  await pa.waitForFunction(() =>
    document
      .querySelector('textarea[id^="note-body-"]')
      ?.value.includes("offline"),
  );
  await pb.waitForFunction(() => {
    const v = document.querySelector('textarea[id^="note-body-"]')?.value;
    return v?.includes("offline") && v.includes("online");
  });
  await pa.reload();
  await pa.getByRole("tab", { name: en.Room.notes, exact: true }).click();
  await pa.waitForFunction(() =>
    document
      .querySelector('textarea[id^="note-body-"]')
      ?.value.includes("offline"),
  );
  await pa.screenshot({
    path: "artifacts/study-notes-desktop.png",
    fullPage: true,
    animations: "disabled",
  });
  await pb.screenshot({
    path: "artifacts/study-notes-mobile.png",
    fullPage: true,
    animations: "disabled",
  });
  await pa.getByRole("tab", { name: en.Room.tasks, exact: true }).click();
  await pb.getByRole("tab", { name: ru.Room.tasks, exact: true }).click();
  await pa
    .getByLabel(en.StudyTools.newTask, { exact: true })
    .fill("Read chapter one");
  await pa
    .getByRole("button", { name: en.StudyTools.addTask, exact: true })
    .click();
  await pb
    .getByRole("checkbox", { name: "Read chapter one", exact: true })
    .waitFor();
  await pb
    .getByRole("button", { name: ru.StudyTools.editTask, exact: true })
    .click();
  await pb
    .getByLabel(ru.StudyTools.taskTitle, { exact: true })
    .fill("Read and discuss chapter one");
  await pb
    .getByRole("button", { name: ru.StudyTools.saveTask, exact: true })
    .click();
  const checkbox = pa.getByRole("checkbox", {
    name: "Read and discuss chapter one",
    exact: true,
  });
  await checkbox.waitFor();
  await checkbox.click();
  await pb.waitForFunction(
    () =>
      document
        .querySelector('[role="checkbox"]')
        ?.getAttribute("aria-checked") === "true",
  );
  assert.equal(
    await pb.getByRole("progressbar").getAttribute("aria-valuenow"),
    "1",
  );
  snapshot = await check(await request(a, prefix), 200);
  const task = snapshot.tasks[0];
  const concurrent = await Promise.all([
    request(a, `${prefix}/tasks/${task.id}`, {
      version: task.version,
      title: "Concurrent A",
    }),
    request(b, `${prefix}/tasks/${task.id}`, {
      version: task.version,
      title: "Concurrent B",
    }),
  ]);
  assert.deepEqual(concurrent.map((r) => r.status()).sort(), [201, 409]);
  // Repeated create IDs never duplicate an item, even across clients.
  const taskId = crypto.randomUUID();
  await Promise.all([
    check(
      await request(a, `${prefix}/tasks`, {
        id: taskId,
        title: "Idempotent task",
      }),
    ),
    check(
      await request(b, `${prefix}/tasks`, {
        id: taskId,
        title: "Idempotent task",
      }),
    ),
  ]);
  assert.equal(await db.studyTask.count({ where: { id: taskId } }), 1);
  // Direct concurrent CRDT requests also converge on the durable document.
  const saved = await check(await request(a, `${prefix}/notes/${noteId}`), 200);
  const docs = [new Y.Doc(), new Y.Doc()];
  for (const doc of docs)
    Y.applyUpdate(doc, Buffer.from(saved.state, "base64"));
  docs[0].getText("body").insert(0, "A: ");
  docs[1].getText("body").insert(0, "B: ");
  await Promise.all(
    docs.map(async (doc, index) =>
      check(
        await request(index ? b : a, `${prefix}/notes/${noteId}`, {
          state: Buffer.from(Y.encodeStateAsUpdate(doc)).toString("base64"),
        }),
      ),
    ),
  );
  const final = await check(await request(a, `${prefix}/notes/${noteId}`), 200);
  const merged = new Y.Doc();
  Y.applyUpdate(merged, Buffer.from(final.state, "base64"));
  assert.ok(
    merged.getText("body").toString().includes("A: ") &&
      merged.getText("body").toString().includes("B: "),
  );
  for (const doc of [...docs, merged]) doc.destroy();
  await pb.screenshot({
    path: "artifacts/study-tasks-mobile.png",
    fullPage: true,
    animations: "disabled",
  });
  assert.equal(
    await pb.evaluate(() => document.documentElement.scrollWidth > innerWidth),
    false,
  );
  await pb
    .getByRole("button", { name: ru.StudyTools.deleteTask, exact: true })
    .first()
    .click();
  await pb
    .getByRole("dialog")
    .getByRole("button", { name: ru.StudyTools.delete, exact: true })
    .click();
  await pa.waitForFunction(
    () => document.querySelectorAll('[role="checkbox"]').length === 1,
  );
  await pa.getByRole("tab", { name: en.Room.notes, exact: true }).click();
  await pa
    .getByRole("button", { name: en.StudyTools.deleteNote, exact: true })
    .click();
  await pa
    .getByRole("dialog")
    .getByRole("button", { name: en.StudyTools.delete, exact: true })
    .click();
  await pa.getByText(en.StudyTools.noNotes, { exact: true }).waitFor();
  assert.equal(await db.studyNote.count({ where: { roomId: room.roomId } }), 0);
  assert.deepEqual(errors, []);
  console.log(
    "PASS: room authorization/isolation; two-participant notes, concurrent merge, offline draft recovery, export, persistence; task CRUD/progress/conflicts/idempotency; realtime delete; RU/EN; mobile layout.",
  );
} finally {
  await browser.close();
  await db.aiJob.deleteMany({ where: { roomId: { in: rooms } } });
  await db.message.deleteMany({ where: { roomId: { in: rooms } } });
  await db.sessionProposal.deleteMany({
    where: { listingId: { in: listings } },
  });
  await db.listing.deleteMany({ where: { id: { in: listings } } });
  await db.room.deleteMany({ where: { id: { in: rooms } } });
  await db.publicProfile.deleteMany({ where: { sessionId: { in: sessions } } });
  await db.session.deleteMany({ where: { id: { in: sessions } } });
  await db.$disconnect();
}
