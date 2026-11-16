import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
const require = createRequire(import.meta.url),
  en = require("../client/messages/en.json"),
  ru = require("../client/messages/ru.json");
const settings = await readFile(
  new URL("../.env.home", import.meta.url),
  "utf8",
);
const value = (key) =>
  settings.match(new RegExp(`^${key}=(.+)$`, "m"))?.[1]?.trim();
const base = value("PUBLIC_ORIGIN"),
  password = value("PRESENTER_PASSWORD");
assert.match(
  base,
  /^https:\/\/(?:[a-z0-9-]+\.trycloudflare\.com|pair-up\.ru)$/,
);
const browser = await chromium.launch({ channel: "msedge", headless: true });
const a = await browser.newContext({ locale: "en-US" }),
  b = await browser.newContext({
    locale: "ru-RU",
    viewport: { width: 390, height: 844 },
  });
const id = crypto.randomUUID(),
  roomId = `listing-${id}`,
  sessions = [];
async function check(response, status = 201) {
  assert.equal(response.status(), status);
  return response.json();
}
try {
  if (base === "https://pair-up.ru") {
    const probe = await b.newPage();
    await probe.goto("http://pair-up.ru/?source=https-check");
    assert.equal(probe.url(), "https://pair-up.ru/?source=https-check");
    await probe.close();
    console.log(
      "PASS: browser HTTP navigation redirects to valid HTTPS without losing the query string.",
    );
  }
  const owner = await check(
    await a.request.post(`${base}/api/auth/presenter`, { data: { password } }),
  );
  sessions.push(owner.id);
  const guest = await check(
    await b.request.post(`${base}/api/auth/demo`, {
      data: {},
      headers: { Origin: base },
    }),
  );
  sessions.push(guest.id);
  const cookie = (await a.cookies()).find((c) => c.httpOnly);
  assert.ok(cookie?.secure, "Session cookie must be secure over public HTTPS");
  await check(
    await a.request.post(`${base}/api/listings`, {
      data: {
        id,
        title: "Home deployment verification",
        description: "Isolated public tunnel test",
        subject: "english",
        level: "intermediate",
        goal: "Check HTTPS and realtime",
        authorName: "Home verification",
        format: "online",
        location: "",
        schedule: "",
      },
    }),
  );
  const proposal = await check(
    await b.request.post(`${base}/api/listings/${id}/proposals`, { data: {} }),
  );
  await check(
    await a.request.post(`${base}/api/proposals/${proposal.id}/respond`, {
      data: { accept: true },
    }),
  );
  const pa = await a.newPage(),
    pb = await b.newPage();
  await Promise.all([
    pa.goto(`${base}/messages/${roomId}`),
    pb.goto(`${base}/messages/${roomId}`),
  ]);

  await pa.getByRole("tab", { name: en.Room.whiteboard, exact: true }).click();
  await pb.getByRole("tab", { name: ru.Room.whiteboard, exact: true }).click();
  await pa
    .getByRole("button", { name: en.Activities.pencil, exact: true })
    .click();
  const canvas = pa.locator("[data-board-canvas]"),
    r = await canvas.boundingBox();
  let boardReads = 0,
    boardWrites = 0;
  pa.on("request", (request) => {
    if (request.url().endsWith(`/rooms/${roomId}/tools/board`)) {
      if (request.method() === "GET") boardReads++;
      if (request.method() === "POST") boardWrites++;
    }
  });
  const drawingStarted = Date.now();
  await pa.mouse.move(r.x + r.width * 0.15, r.y + r.height * 0.2);
  await pa.mouse.down();
  await pa.mouse.move(r.x + r.width * 0.8, r.y + r.height * 0.3, {
    steps: 160,
  });
  const prefix = (
    await canvas.locator("polyline").last().getAttribute("points")
  )
    .split(" ")
    .map((p) => p.split(",").map(Number));
  for (let i = 0; i < 4; i++)
    await pa.mouse.move(
      r.x + r.width * (i % 2 ? 0.8 : 0.15),
      r.y + r.height * (0.4 + i * 0.1),
      { steps: 180 },
    );
  await pa.mouse.up();
  await pb.waitForFunction(
    () => document.querySelectorAll("[data-board-canvas] g").length >= 3,
    null,
    { timeout: 20000 },
  );
  await pa.waitForFunction(
    (text) => !document.body.innerText.includes(text),
    en.Activities.saving,
  );
  assert.ok(
    boardWrites >= 3 && boardWrites <= 5,
    `Bounded segment writes: ${boardWrites}`,
  );
  assert.ok(
    boardReads <= Math.floor((Date.now() - drawingStarted) / 20000) + 1,
    `No per-segment board refetches: ${boardReads} reads for ${boardWrites} writes`,
  );
  console.log(
    `Board traffic: ${boardWrites} writes, ${boardReads} GET requests during drawing.`,
  );
  const board = await pa.evaluate(
    async (url) => (await fetch(url)).json(),
    "/api/rooms/" + roomId + "/tools/board",
  );
  const first = board.elements.find((e) => e.id === e.strokeId),
    segments = board.elements.filter((e) => e.strokeId === first.strokeId);
  assert.ok(segments.length >= 3);
  assert.deepEqual(first.points.slice(0, prefix.length), prefix);
  assert.ok(segments.every((e) => e.points.length <= 250));
  assert.ok(segments.reduce((n, e) => n + e.points.length - 1, 1) > 650);
  await pa.reload();
  await pa.getByRole("tab", { name: en.Room.whiteboard, exact: true }).click();
  await pa.waitForFunction(
    (count) =>
      document.querySelectorAll("[data-board-canvas] polyline").length ===
      count,
    segments.length,
  );
  const inline = await pb.locator("[data-board-canvas]").boundingBox();
  await pb
    .getByRole("button", { name: ru.Activities.expandBoard, exact: true })
    .click();
  const dialog = pb.getByRole("dialog", {
    name: ru.Activities.canvas,
    exact: true,
  });
  await dialog.waitFor();
  const bounds = await dialog.boundingBox();
  assert.ok(
    bounds.width >= 388 &&
      bounds.height >= 842 &&
      Math.abs(bounds.x) < 1 &&
      Math.abs(bounds.y) < 1,
    JSON.stringify(bounds),
  );
  const enlarged = await dialog.locator("[data-board-canvas]").boundingBox();
  assert.ok(enlarged.width > inline.width);
  await dialog
    .getByRole("button", { name: ru.Activities.zoomIn, exact: true })
    .click();
  assert.ok(
    (await dialog.locator("[data-board-canvas]").boundingBox()).width >
      enlarged.width,
  );
  await dialog
    .getByRole("button", { name: ru.Activities.fitBoard, exact: true })
    .click();
  await dialog
    .getByRole("button", { name: ru.Activities.text, exact: true })
    .click();
  await dialog
    .locator("[data-board-canvas]")
    .click({ position: { x: 40, y: 45 } });
  const textDialog = pb.getByRole("dialog", {
    name: ru.Activities.addText,
    exact: true,
  });
  await textDialog.getByRole("textbox").fill("Fullscreen note");
  await textDialog
    .getByRole("button", { name: ru.Activities.addText, exact: true })
    .click();
  await pa
    .locator("[data-board-canvas] text")
    .getByText("Fullscreen note", { exact: true })
    .waitFor({ timeout: 15000 });
  await pb.screenshot({ path: "artifacts/board-fullscreen-portrait.png" });
  await pb.setViewportSize({ width: 844, height: 390 });
  await pb.screenshot({ path: "artifacts/board-fullscreen-landscape.png" });
  const landscape = await dialog.boundingBox();
  assert.ok(landscape.width >= 842 && landscape.height >= 388);
  await pb.route("**/tools/board", (route) =>
    route.request().method() === "POST" &&
    route.request().postDataJSON()?.action === "clear"
      ? route.fulfill({
          status: 503,
          contentType: "application/json",
          body: JSON.stringify({ code: "SERVER_ERROR" }),
        })
      : route.continue(),
  );
  await dialog
    .getByRole("button", { name: ru.Activities.clearBoard, exact: true })
    .click();
  const confirmation = pb.getByRole("alertdialog");
  await confirmation
    .getByRole("button", { name: ru.Activities.clearBoard, exact: true })
    .click();
  await confirmation.getByRole("alert").waitFor();
  assert.equal(await confirmation.isVisible(), true);
  await pb.unroute("**/tools/board");
  await confirmation
    .getByRole("button", { name: ru.Activities.clearBoard, exact: true })
    .click();
  await confirmation.waitFor({ state: "hidden" });
  assert.equal(await dialog.isVisible(), true);
  await pa.waitForFunction(
    () => document.querySelectorAll("[data-board-canvas] g").length === 0,
  );
  console.log(
    "PASS: failed clear stays open with feedback; successful clear closes confirmation, keeps fullscreen open, and syncs to the other participant.",
  );
  await dialog
    .getByRole("button", { name: ru.Activities.collapseBoard, exact: true })
    .click();
  await dialog.waitFor({ state: "hidden" });
  await pb.setViewportSize({ width: 390, height: 844 });
  await pb.getByRole("tab", { name: ru.Room.files, exact: true }).click();
  assert.equal(
    await pb.getByRole("heading", { name: ru.Files.drop, exact: true }).count(),
    0,
  );
  assert.equal(
    await pb
      .getByRole("button", { name: ru.Files.choose, exact: true })
      .count(),
    0,
  );
  await pb.getByRole("tab", { name: ru.Room.chat, exact: true }).click();
  const chooser = pb.waitForEvent("filechooser");
  await pb.getByRole("button", { name: ru.Room.files, exact: true }).click();
  await (await chooser).setFiles([]);
  console.log(
    "PASS: long stroke retains prefix and >650 points across bounded segments, realtime/persistence, fullscreen portrait/landscape, zoom, nested text dialog, files library without upload section, chat attachment picker.",
  );
} finally {
  await browser.close();
  const cleanup = `const {PrismaClient}=require('@prisma/client');const db=new PrismaClient();const roomId=process.argv[1],id=process.argv[2],ids=JSON.parse(process.argv[3]);(async()=>{await db.aiJob.deleteMany({where:{roomId}});await db.attachment.deleteMany({where:{roomId}});await db.message.deleteMany({where:{roomId}});await db.sessionProposal.deleteMany({where:{listingId:id}});await db.listing.deleteMany({where:{id}});await db.room.deleteMany({where:{id:roomId}});await db.publicProfile.deleteMany({where:{sessionId:{in:ids}}});await db.session.deleteMany({where:{id:{in:ids}}});await db.$disconnect();})().catch(e=>{console.error(e.message);process.exitCode=1;});`;
  const result = spawnSync(
    "docker",
    [
      "compose",
      "--env-file",
      ".env.home",
      "-f",
      "compose.home.yaml",
      "exec",
      "-T",
      "server",
      "node",
      "-e",
      cleanup,
      roomId,
      id,
      JSON.stringify(sessions),
    ],
    { cwd: fileURLToPath(new URL("../", import.meta.url)), encoding: "utf8" },
  );
  if (result.status !== 0)
    throw Error(`Own test-data cleanup failed: ${result.stderr}`);
}
