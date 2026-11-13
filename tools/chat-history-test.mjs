import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { readFile, unlink } from "node:fs/promises";
import { resolve, join } from "node:path";
import { chromium } from "playwright";
const require = createRequire(
  new URL("../server/package.json", import.meta.url),
);
require("dotenv").config({
  path: fileURLToPath(new URL("../server/.env", import.meta.url)),
  quiet: true,
});
const { PrismaClient } = require("@prisma/client");
const db = new PrismaClient();
const en = require("../client/messages/en.json"),
  ru = require("../client/messages/ru.json");
const base = "http://localhost:3000",
  id = crypto.randomUUID(),
  roomId = `listing-${id}`,
  sessions = [];
const browser = await chromium.launch({ channel: "msedge", headless: true });
const a = await browser.newContext({
    locale: "en-US",
    viewport: { width: 1440, height: 1000 },
  }),
  b = await browser.newContext({
    locale: "ru-RU",
    viewport: { width: 390, height: 844 },
  }),
  stranger = await browser.newContext(),
  anon = await browser.newContext();
const prefix = `${base}/api/rooms/${roomId}/files`;
async function login(ctx) {
  const r = await ctx.request.post(`${base}/api/auth/demo`, { data: {} });
  assert.equal(r.status(), 201);
  sessions.push((await r.json()).id);
}
async function select(page, payload) {
  const chooser = page.waitForEvent("filechooser");
  await page.getByRole("button", { name: en.Room.files, exact: true }).click();
  await (await chooser).setFiles(payload);
}
const errors = [];
try {
  await login(a);
  await login(b);
  await login(stranger);
  const created = await a.request.post(`${base}/api/listings`, {
    data: {
      id,
      title: "Files integration session",
      description: "An isolated room for media and attachment checks.",
      subject: "english",
      level: "intermediate",
      goal: "Study with shared materials",
      format: "online",
      location: "",
      schedule: "",
      authorName: "Files test",
    },
  });
  assert.equal(created.status(), 201);
  const proposal = await (
    await b.request.post(`${base}/api/listings/${id}/proposals`, { data: {} })
  ).json();
  assert.equal(
    (
      await a.request.post(`${base}/api/proposals/${proposal.id}/respond`, {
        data: { accept: true },
      })
    ).status(),
    201,
  );
  assert.equal((await anon.request.get(prefix)).status(), 401);
  assert.equal((await stranger.request.get(prefix)).status(), 403);

  const profile = await db.publicProfile.findUniqueOrThrow({
    where: { sessionId: sessions[0] },
  });
  await db.message.createMany({
    data: Array.from({ length: 135 }, (_, i) => ({
      roomId,
      author: profile.name,
      authorProfileId: profile.id,
      sessionId: sessions[0],
      text: "History " + String(i).padStart(3, "0"),
      clientRequestId: crypto.randomUUID(),
    })),
  });
  const latest = await (
    await b.request.get(base + "/api/rooms/" + roomId + "/messages")
  ).json();
  assert.equal(latest.messages.length, 50);
  assert.equal(latest.messages[0].text, "History 085");
  assert.equal(latest.hasOlder, true);
  const previous = await (
    await b.request.get(
      base +
        "/api/rooms/" +
        roomId +
        "/messages?before=" +
        latest.messages[0].seq +
        "&generation=" +
        latest.generation,
    )
  ).json();
  assert.equal(previous.messages.length, 50);
  assert.equal(previous.messages[0].text, "History 035");
  const oldest = await (
    await b.request.get(
      base +
        "/api/rooms/" +
        roomId +
        "/messages?before=" +
        previous.messages[0].seq,
    )
  ).json();
  assert.equal(oldest.messages.length, 35);
  assert.equal(oldest.hasOlder, false);
  assert.equal(
    (
      await b.request.get(
        base + "/api/rooms/" + roomId + "/messages?before=abc",
      )
    ).status(),
    400,
  );
  assert.equal(
    (
      await b.request.get(
        base + "/api/rooms/" + roomId + "/messages?before=1&after=2",
      )
    ).status(),
    400,
  );
  const page = await b.newPage();
  await page.goto(base + "/messages/" + roomId);
  const log = page.getByRole("log");
  await log.getByText("History 134", { exact: true }).waitFor();
  assert.equal(await log.locator("article").count(), 50);
  await log.evaluate((el) => {
    el.scrollTop = 0;
    el.dispatchEvent(new Event("scroll"));
  });
  await log.getByText("History 035", { exact: true }).waitFor();
  assert.equal(await log.locator("article").count(), 100);
  assert.ok(
    (await log.evaluate((el) => el.scrollTop)) > 200,
    "Prepending preserves scroll position",
  );
  await log
    .getByRole("button", {
      name: ru.ChatExtras.viewProfile.replace("{name}", profile.name),
      exact: true,
    })
    .first()
    .click();
  await page.getByRole("dialog").waitFor();
  await page.getByRole("link", { name: ru.ChatExtras.fullProfile }).waitFor();
  assert.ok(
    (
      await page
        .getByRole("link", { name: ru.ChatExtras.fullProfile })
        .getAttribute("href")
    ).endsWith("/users/" + profile.id),
  );
  await page.keyboard.press("Escape");
  const tail = await db.message.create({
    data: {
      roomId,
      author: profile.name,
      authorProfileId: profile.id,
      sessionId: sessions[0],
      text: "Reconnect catch-up",
      clientRequestId: crypto.randomUUID(),
    },
  });
  const forward = await (
    await b.request.get(
      base +
        "/api/rooms/" +
        roomId +
        "/messages?after=" +
        latest.messages.at(-1).seq,
    )
  ).json();
  assert.equal(forward.messages[0].id, tail.id);
  console.log(
    "PASS: latest 50, cursor pagination, authorization, invalid cursors, prepend scroll anchoring, profile dialog and catch-up.",
  );
} finally {
  await browser.close();
  const files = await db.attachment.findMany({
    where: { roomId },
    select: { storageKey: true },
  });
  for (const file of files) {
    assert.match(file.storageKey, /^[0-9a-f-]{36}$/i);
    const root = resolve(
        fileURLToPath(new URL("../server/", import.meta.url)),
        process.env.UPLOAD_DIR || "uploads",
      ),
      path = join(root, file.storageKey);
    assert.ok(path.startsWith(root));
    await unlink(path).catch((e) => {
      if (e.code !== "ENOENT") throw e;
    });
  }
  await db.attachment.deleteMany({ where: { roomId } });
  await db.message.deleteMany({ where: { roomId } });
  await db.sessionProposal.deleteMany({ where: { listingId: id } });
  await db.listing.deleteMany({ where: { id } });
  await db.room.deleteMany({ where: { id: roomId } });
  await db.publicProfile.deleteMany({ where: { sessionId: { in: sessions } } });
  await db.session.deleteMany({ where: { id: { in: sessions } } });
  await db.$disconnect();
}
