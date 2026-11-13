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
  const image = await readFile(
    new URL("../client/public/mascots/neuron.png", import.meta.url),
  );
  assert.equal(
    (
      await stranger.request.post(prefix, {
        multipart: {
          clientRequestId: crypto.randomUUID(),
          file: { name: "Denied.png", mimeType: "image/png", buffer: image },
        },
      })
    ).status(),
    403,
  );
  const pa = await a.newPage(),
    pb = await b.newPage();
  for (const p of [pa, pb]) p.on("pageerror", (e) => errors.push(e.message));
  await Promise.all([
    pa.goto(`${base}/messages/${roomId}`),
    pb.goto(`${base}/messages/${roomId}`),
  ]);
  await pa.getByText(en.Demo.connected, { exact: true }).waitFor();
  await pb.getByText(ru.Demo.connected, { exact: true }).waitFor();
  await select(pa, [
    { name: "Нейрон.png", mimeType: "image/png", buffer: image },
    {
      name: "Lesson notes.txt",
      mimeType: "text/plain",
      buffer: Buffer.from("Shared learning materials"),
    },
  ]);
  await pb.getByRole("img", { name: "Нейрон.png", exact: true }).waitFor();
  await pb.getByText("Lesson notes.txt", { exact: true }).waitFor();
  await pb.waitForFunction(() =>
    [...document.images].some(
      (img) => img.alt === "Нейрон.png" && img.complete && img.naturalWidth > 0,
    ),
  );
  const imageState = await pb
    .getByRole("img", { name: "Нейрон.png", exact: true })
    .evaluate((img) => ({ complete: img.complete, width: img.naturalWidth }));
  assert.ok(imageState.width > 0);
  const downloadPromise = pb.waitForEvent("download");
  await pb
    .getByRole("link", {
      name: ru.Files.download.replace("{name}", "Lesson notes.txt"),
      exact: true,
    })
    .click();
  assert.equal((await downloadPromise).suggestedFilename(), "Lesson notes.txt");
  const snapshot = await (await a.request.get(prefix)).json();
  assert.equal(snapshot.length, 2);
  const photo = snapshot.find((f) => f.kind === "image");
  assert.equal(photo.name, "Нейрон.png");
  assert.ok(!("storageKey" in photo));
  assert.equal(
    (await stranger.request.get(`${prefix}/${photo.id}/content`)).status(),
    403,
  );
  assert.equal(
    (await anon.request.get(`${prefix}/${photo.id}/content`)).status(),
    401,
  );
  const content = await b.request.get(`${prefix}/${photo.id}/content`);
  assert.deepEqual(await content.body(), image);
  assert.equal(content.headers()["content-type"], "image/png");
  assert.match(content.headers()["cache-control"], /private/);
  const cached = await b.request.get(`${prefix}/${photo.id}/content`, {
    headers: { "If-None-Match": content.headers().etag },
  });
  assert.equal(cached.status(), 304);
  assert.equal(
    (
      await anon.request.get(`${prefix}/${photo.id}/content`, {
        headers: { "If-None-Match": content.headers().etag },
      })
    ).status(),
    401,
  );
  assert.equal(
    await pb
      .getByRole("log")
      .getByRole("link", {
        name: ru.Files.download.replace("{name}", "Нейрон.png"),
      })
      .count(),
    0,
  );
  // A real WebM is produced locally, using a synthetic canvas rather than a camera.
  const video = Buffer.from(
    await pa.evaluate(async () => {
      const canvas = document.createElement("canvas");
      canvas.width = 240;
      canvas.height = 140;
      const ctx = canvas.getContext("2d");
      const stream = canvas.captureStream(12);
      const chunks = [];
      const recorder = new MediaRecorder(stream, {
        mimeType: "video/webm;codecs=vp8",
      });
      return new Promise((resolve, reject) => {
        recorder.ondataavailable = (e) => chunks.push(e.data);
        recorder.onerror = reject;
        recorder.onstop = async () => {
          stream.getTracks().forEach((t) => t.stop());
          resolve([...new Uint8Array(await new Blob(chunks).arrayBuffer())]);
        };
        recorder.start();
        let frame = 0;
        const timer = setInterval(() => {
          ctx.fillStyle = frame++ % 2 ? "#6055d8" : "#83bcb5";
          ctx.fillRect(0, 0, 240, 140);
        }, 50);
        setTimeout(() => {
          clearInterval(timer);
          recorder.stop();
        }, 600);
      });
    }),
  );
  await select(pa, {
    name: "Study clip.webm",
    mimeType: "video/webm",
    buffer: video,
  });
  const player = pb.getByLabel("Study clip.webm", { exact: true });
  await player.waitFor();
  await pb.waitForFunction(
    () => document.querySelector("video")?.readyState >= 1,
  );
  await player.evaluate(async (v) => {
    v.muted = true;
    await v.play();
  });
  assert.equal(await player.evaluate((v) => v.paused), false);
  const videoFile = (await (await a.request.get(prefix)).json()).find(
    (f) => f.kind === "video",
  );
  const range = await b.request.get(`${prefix}/${videoFile.id}/content`, {
    headers: { Range: "bytes=0-15" },
  });
  assert.equal(range.status(), 206);
  assert.equal((await range.body()).length, 16);
  const chatImage = await pb
    .getByRole("log")
    .locator("img")
    .first()
    .elementHandle();
  await pb.getByRole("tab", { name: ru.Room.files, exact: true }).click();
  assert.ok(
    await chatImage.evaluate((el) => el.isConnected),
    "Chat media stays mounted when opening tools",
  );
  const library = pb.getByRole("list", { name: ru.Files.sharedFiles });
  await library.getByText("Lesson notes.txt", { exact: true }).waitFor();
  const fromLibrary = pb.waitForEvent("download");
  await library
    .getByRole("link", {
      name: ru.Files.download.replace("{name}", "Lesson notes.txt"),
      exact: true,
    })
    .click();
  assert.equal((await fromLibrary).suggestedFilename(), "Lesson notes.txt");
  await pb.getByRole("button", { name: new RegExp(ru.Files.gallery) }).click();
  await library
    .getByRole("button", {
      name: ru.Files.viewImage.replace("{name}", "Нейрон.png"),
      exact: true,
    })
    .click();
  await pb.getByRole("dialog").waitFor();
  await pb.keyboard.press("Escape");
  await pb
    .getByRole("button", { name: new RegExp(ru.Files.documents) })
    .click();
  // A drop into the actual chat creates the same durable attachment/message pair.
  await pa
    .getByRole("region", { name: en.Room.chat, exact: true })
    .evaluate((el) => {
      const data = new DataTransfer();
      data.items.add(
        new File(["Drop content"], "Dropped.txt", { type: "text/plain" }),
      );
      el.dispatchEvent(
        new DragEvent("drop", { bubbles: true, dataTransfer: data }),
      );
    });
  await library.getByText("Dropped.txt", { exact: true }).waitFor();
  // Transport retries keep a stable request ID and cannot duplicate messages/files.
  await pa.route(`**/api/rooms/${roomId}/files`, (route) =>
    route.request().method() === "POST" ? route.abort() : route.continue(),
  );
  await select(pa, {
    name: "Retry.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("Retry content"),
  });
  await pa
    .getByRole("alert")
    .filter({ hasText: en.Files.UPLOAD_FAILED })
    .waitFor();
  await pa.unroute(`**/api/rooms/${roomId}/files`);
  await pa.getByRole("button", { name: en.Files.retry, exact: true }).click();
  await library.getByText("Retry.txt", { exact: true }).waitFor();
  const requestId = crypto.randomUUID(),
    multipart = {
      clientRequestId: requestId,
      file: {
        name: "Once.txt",
        mimeType: "text/plain",
        buffer: Buffer.from("Only once"),
      },
    };
  const responses = await Promise.all([
    a.request.post(prefix, { multipart }),
    a.request.post(prefix, { multipart }),
  ]);
  assert.ok(responses.every((r) => r.status() === 201));
  assert.equal(
    (await responses[0].json()).attachment.id,
    (await responses[1].json()).attachment.id,
  );
  const forged = await a.request.post(prefix, {
    multipart: {
      clientRequestId: crypto.randomUUID(),
      file: {
        name: "Unsafe.svg",
        mimeType: "image/png",
        buffer: Buffer.from('<svg onload="alert(1)"/>'),
      },
    },
  });
  assert.equal(forged.status(), 201);
  const forgedFile = (await forged.json()).attachment;
  assert.equal(forgedFile.kind, "file");
  const forced = await b.request.get(`${prefix}/${forgedFile.id}/content`);
  assert.match(forced.headers()["content-disposition"], /^attachment;/);
  assert.equal(forced.headers()["x-content-type-options"], "nosniff");
  const large = await a.request.post(prefix, {
    multipart: {
      clientRequestId: crypto.randomUUID(),
      file: {
        name: "Large.bin",
        mimeType: "application/octet-stream",
        buffer: Buffer.alloc(11 * 1024 * 1024, 1),
      },
    },
  });
  assert.equal(large.status(), 201);
  assert.equal((await large.json()).attachment.size, 11 * 1024 * 1024);
  const oversized = await a.request.post(prefix, {
    multipart: {
      clientRequestId: crypto.randomUUID(),
      file: {
        name: "Too-large.bin",
        mimeType: "application/octet-stream",
        buffer: Buffer.alloc(51 * 1024 * 1024, 1),
      },
    },
  });
  assert.equal(oversized.status(), 413);
  assert.equal((await oversized.json()).code, "FILE_TOO_LARGE");
  // Desktop pointer resizing, limits, keyboard access and persistence.
  await pa.getByRole("tab", { name: en.Room.files, exact: true }).click();
  const separator = pa.getByRole("separator", {
      name: en.Files.resize,
      exact: true,
    }),
    sidebar = pa.getByRole("complementary", {
      name: en.Room.tools,
      exact: true,
    });
  const start = await sidebar.boundingBox(),
    handle = await separator.boundingBox();
  assert.ok(start.width < 600);
  await pa.mouse.move(handle.x + handle.width / 2, handle.y + 100);
  await pa.mouse.down();
  await pa.mouse.move(handle.x - 180, handle.y + 100, { steps: 8 });
  await pa.mouse.up();
  const expanded = await sidebar.boundingBox();
  assert.ok(expanded.width > start.width + 150);
  await separator.focus();
  await pa.keyboard.press("ArrowRight");
  assert.ok((await sidebar.boundingBox()).width < expanded.width);
  const stored = await pa.evaluate(() =>
    JSON.parse(localStorage.getItem("pairup.tools-width")),
  );
  await pa.reload();
  await pa.getByRole("tab", { name: en.Room.files, exact: true }).click();
  assert.equal(Math.round((await sidebar.boundingBox()).width), stored);
  await separator.dblclick();
  assert.equal(Math.round((await sidebar.boundingBox()).width), 440);
  assert.equal(
    await pb
      .getByRole("separator", { name: ru.Files.resize, exact: true })
      .count(),
    0,
  );
  await pa.screenshot({
    path: "artifacts/files-desktop.png",
    fullPage: true,
    animations: "disabled",
  });
  await pb.screenshot({
    path: "artifacts/files-mobile.png",
    fullPage: true,
    animations: "disabled",
  });
  assert.equal(
    await pb.evaluate(() => document.documentElement.scrollWidth > innerWidth),
    false,
  );
  const before = await db.attachment.count({ where: { roomId } });
  await pb.reload();
  await pb.getByRole("tab", { name: ru.Room.files, exact: true }).click();
  await pb
    .getByRole("list", { name: ru.Files.sharedFiles })
    .getByText("Lesson notes.txt", { exact: true })
    .waitFor();
  assert.equal(await db.attachment.count({ where: { roomId } }), before);
  assert.deepEqual(errors, []);
  console.log(
    "PASS: two-browser image/document/video upload, playback, ranges, chat/library downloads, drop, retry/idempotency, MIME safety, >10MB proxy, room access, reload; pointer/keyboard resize and persistence; mobile layout.",
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
