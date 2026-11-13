import {mkdir} from "node:fs/promises";
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

  const timerPath = prefix + "/timer",
    boardPath = prefix + "/board";
  for (const path of [timerPath, boardPath]) {
    assert.equal((await request(anonymous, path)).status(), 401);
    assert.equal((await request(stranger, path)).status(), 403);
    assert.equal((await request(stranger, path, {})).status(), 403);
  }
  let timer = await check(await request(a, timerPath), 200);
  timer = await check(
    await request(a, timerPath, {
      action: "configure",
      version: timer.version,
      focusSeconds: 60,
      breakSeconds: 60,
      longBreakSeconds: 120,
    }),
  );
  await pa.getByRole("tab", { name: en.Room.pomodoro, exact: true }).click();
  await pb.getByRole("tab", { name: ru.Room.pomodoro, exact: true }).click();
  await pa.getByRole("timer").getByText("01:00", { exact: true }).waitFor();
  await pa
    .getByRole("button", { name: en.Activities.start, exact: true })
    .click();
  await pb
    .getByRole("button", { name: ru.Activities.pause, exact: true })
    .waitFor({ timeout: 4000 });
  await pb
    .getByRole("button", { name: ru.Activities.pause, exact: true })
    .click();
  await pa
    .getByRole("button", { name: en.Activities.start, exact: true })
    .waitFor({ timeout: 4000 });
  timer = await check(await request(a, timerPath), 200);
  assert.equal(timer.endsAt, null);
  assert.ok(timer.remainingMs < 60000);
  await pa.getByLabel(en.Activities.focusMinutes,{exact:true}).fill("2");
  await pa.getByRole("button",{name:en.Activities.apply,exact:true}).click();
  await pb.getByRole("timer").getByText("02:00",{exact:true}).waitFor({timeout:4000});
  timer=await check(await request(a,timerPath),200);
  const versions = await Promise.all([
    request(a, timerPath, { action: "start", version: timer.version }),
    request(b, timerPath, { action: "reset", version: timer.version }),
  ]);
  assert.deepEqual(versions.map((r) => r.status()).sort(), [201, 409]);
  await db.roomTimer.update({
    where: { roomId: room.roomId },
    data: { endsAt: new Date(Date.now() - 1000) },
  });
  await pa.reload();
  await pa.getByRole("tab", { name: en.Room.pomodoro, exact: true }).click();
  await pa.getByRole("timer").getByText("00:00", { exact: true }).waitFor();
  await pa
    .getByRole("button", { name: en.Activities.next, exact: true })
    .click();
  await pa
    .getByRole("button", {
      name: en.Activities.break,
      exact: true,
      pressed: true,
    })
    .waitFor();
  timer = await check(await request(a, timerPath), 200);
  assert.equal(timer.mode, "break");
  assert.equal(timer.endsAt, null);
  await pa.getByRole("tab", { name: en.Room.whiteboard, exact: true }).click();
  await pb.getByRole("tab", { name: ru.Room.whiteboard, exact: true }).click();
  const canvasA = pa.locator("[data-board-canvas]"),
    canvasB = pb.locator("[data-board-canvas]");
  await pa
    .getByRole("button", { name: en.Activities.pencil, exact: true })
    .waitFor();
  async function draw() {
    const r = await canvasA.boundingBox();
    await pa.mouse.move(r.x + r.width * 0.2, r.y + r.height * 0.3);
    await pa.mouse.down();
    await pa.mouse.move(r.x + r.width * 0.7, r.y + r.height * 0.6, {
      steps: 8,
    });
    await pa.mouse.up();
  }
  await draw();
  await canvasB.locator("polyline").waitFor({ timeout: 4000 });
  await pa
    .getByRole("button", { name: en.Activities.square, exact: true })
    .click();
  await draw();
  await canvasB.locator("g rect").waitFor({ timeout: 4000 });
  await pa
    .getByRole("button", { name: en.Activities.text, exact: true })
    .click();
  await canvasA.click({ position: { x: 40, y: 50 } });
  await pa
    .getByRole("dialog")
    .getByRole("textbox", { name: en.Activities.text, exact: true })
    .fill("Shared <study>");
  await pa
    .getByRole("dialog")
    .getByRole("button", { name: en.Activities.addText, exact: true })
    .click();
  await canvasB
    .getByText("Shared <study>", { exact: true })
    .waitFor({ timeout: 4000 });
  let board = await check(await request(a, boardPath), 200);
  assert.equal(board.elements.length, 3);
  const element = () => ({
    id: crypto.randomUUID(),
    kind: "line",
    color: "#2563eb",
    width: 4,
    points: [
      [10, 20],
      [100, 200],
    ],
  });
  const first = element(),
    second = element();
  const additions=await Promise.all([request(a,boardPath,{action:'add',generation:board.generation,element:first}),request(b,boardPath,{action:'add',generation:board.generation,element:second})]);
  await Promise.all(additions.map(r=>check(r)));
  await check(
    await request(a, boardPath, {
      action: "add",
      generation: board.generation,
      element: first,
    }),
  );
  board = await check(await request(a, boardPath), 200);
  assert.equal(board.elements.length, 5);
  assert.equal(
    (
      await request(a, boardPath, {
        action: "clear",
        generation: board.generation,
        version: 0,
      })
    ).status(),
    409,
  );
  await pa.reload();
  await pa.getByRole("tab", { name: en.Room.whiteboard, exact: true }).click();
  await pa
    .locator("[data-board-canvas] text")
    .getByText("Shared <study>", { exact: true })
    .waitFor();
  await mkdir(fileURLToPath(new URL("../artifacts/activities/",import.meta.url)),{recursive:true});
  await pa.screenshot({path:fileURLToPath(new URL("../artifacts/activities/board-desktop.png",import.meta.url))});
  await pb.screenshot({path:fileURLToPath(new URL("../artifacts/activities/board-mobile.png",import.meta.url))});
  const download = pa.waitForEvent("download");
  await pa
    .getByRole("button", { name: en.Activities.exportBoard, exact: true })
    .click();
  const exported = await download;
  assert.match(exported.suggestedFilename(), /.svg$/);
  const stream = await exported.createReadStream();
  let svg = "";
  for await (const chunk of stream) svg += chunk.toString();
  assert.ok(svg.includes("Shared &lt;study&gt;"));
  await pa
    .getByRole("region", { name: en.Room.whiteboard, exact: true })
    .getByRole("button", { name: en.Activities.clearBoard, exact: true })
    .click();
  await pa
    .getByRole("alertdialog")
    .getByRole("button", { name: en.Activities.cancel, exact: true })
    .click();
  assert.equal(
    (await check(await request(a, boardPath), 200)).elements.length,
    5,
  );
  await pa
    .getByRole("region", { name: en.Room.whiteboard, exact: true })
    .getByRole("button", { name: en.Activities.clearBoard, exact: true })
    .click();
  await pa
    .getByRole("alertdialog")
    .getByRole("button", { name: en.Activities.clearBoard, exact: true })
    .click();
  await pb.waitForFunction(
    () => document.querySelectorAll("[data-board-canvas] g").length === 0,
    null,
    { timeout: 4000 },
  );
  assert.equal(
    (
      await request(a, boardPath, {
        action: "add",
        generation: board.generation,
        element: element(),
      })
    ).status(),
    409,
  );
  assert.equal(
    (
      await check(
        await request(a, "/rooms/" + other.roomId + "/tools/board"),
        200,
      )
    ).elements.length,
    0,
  );
  assert.ok(
    await pb.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
  );
  assert.deepEqual(errors, []);
  console.log(
    "PASS: two-participant board drawing/text/shapes, concurrency/idempotency, persistent SVG export and confirmed clear; stale-write isolation; synced timer start/pause, expiry, settings and conflict protection; room authorization and mobile layout.",
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
