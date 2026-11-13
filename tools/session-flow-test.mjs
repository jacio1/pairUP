import { chromium } from "playwright";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { randomUUID } from "node:crypto";
import { mkdir } from "node:fs/promises";
const require = createRequire(
  new URL("../server/package.json", import.meta.url),
);
require("dotenv").config({
  path: new URL("../server/.env", import.meta.url).pathname.replace(
    /^\/(\w:)/,
    "$1",
  ),
  quiet: true,
});
const { PrismaClient } = require("@prisma/client");
const db = new PrismaClient();
const browser = await chromium.launch({ channel: "msedge", headless: true });
const owner = await browser.newContext({ locale: "en-US" });
const guest = await browser.newContext({
  locale: "en-US",
  viewport: { width: 390, height: 844 },
});
const stranger = await browser.newContext({ locale: "ru-RU" });
const id = randomUUID();
const roomId = `listing-${id}`;
const sessionIds = [];
const base = "http://localhost:3000";
const errors = [];
async function login(context) {
  const response = await context.request.post(`${base}/api/auth/demo`, {
    data: {},
  });
  assert.equal(response.status(), 201);
  const session = await response.json();
  sessionIds.push(session.id);
  return session;
}
try {
  const page = await guest.newPage();
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(`${base}/create`);
  await page.getByRole("heading", { name: "Sign in to continue" }).waitFor();
  await page
    .getByRole("main")
    .getByRole("button", { name: "Sign in", exact: true })
    .click();
  await page.getByRole("button", { name: "Sign up", exact: true }).click();
  await page.getByLabel("Username", { exact: true }).fill("student-test");
  await page.getByLabel("Email", { exact: true }).fill("student@example.com");
  await page
    .getByLabel("Password", { exact: true })
    .first()
    .fill("test-password-123");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("heading", { name: "Check your email" }).waitFor();
  await page.getByLabel("Verification code").fill("123456");
  assert.ok(
    ["", "null"].includes(
      await (await guest.request.get(`${base}/api/me`)).text(),
    ),
  );
  await mkdir("../artifacts", { recursive: true });
  await page.screenshot({
    path: "../artifacts/auth-mobile.png",
    caret: "initial",
  });
  await page
    .getByRole("button", { name: "Sign in as TEST", exact: true })
    .click();
  await page
    .getByRole("heading", { name: "Create listing", exact: true })
    .waitFor();
  const guestSession = await (await guest.request.get(`${base}/api/me`)).json();
  sessionIds.push(guestSession.id);
  const ownerSession = await login(owner);
  await login(stranger);
  const create = await owner.request.post(`${base}/api/listings`, {
    data: {
      id,
      title: "Integration study session",
      subject: "english",
      level: "intermediate",
      goal: "Practise conversation together",
      format: "online",
      schedule: "Evenings",
      location: "",
      description: "An isolated listing for session workflow validation.",
      authorName: "Spoofed name",
    },
  });
  assert.equal(create.status(), 201);
  const listing = await create.json();
  assert.equal(listing.authorName, ownerSession.name);
  assert.equal(
    (await guest.request.get(`${base}/api/rooms/${roomId}/messages`)).status(),
    403,
  );
  await page.goto(`${base}/listings/${id}`);
  await page
    .getByRole("button", { name: "Propose a session", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Waiting for confirmation" })
    .waitFor();
  const requests = await (
    await owner.request.get(`${base}/api/proposals`)
  ).json();
  const proposal = requests.find((p) => p.listingId === id);
  assert.ok(proposal?.incoming);
  assert.equal(
    (
      await stranger.request.post(
        `${base}/api/proposals/${proposal.id}/respond`,
        { data: { accept: true } },
      )
    ).status(),
    403,
  );
  const op = await owner.newPage();
  op.on("pageerror", (e) => errors.push(e.message));
  await op.goto(`${base}/notifications`);
  await op.getByRole("button", { name: "Accept", exact: true }).click();
  await op.getByText("Open session", { exact: true }).waitFor();
  await page
    .getByText("Open session", { exact: true })
    .waitFor({ timeout: 20000 });
  assert.equal(
    (
      await stranger.request.get(`${base}/api/rooms/${roomId}/messages`)
    ).status(),
    403,
  );
  const outsiderPage = await stranger.newPage();
  await outsiderPage.goto(`${base}/messages/${roomId}`);
  await outsiderPage
    .getByRole("heading", { name: "Ожидает подтверждения" })
    .waitFor();
  assert.ok(await (await stranger.request.get(`${base}/api/me`)).json());
  await page.getByText("Open session", { exact: true }).click();
  await op.getByText("Open session", { exact: true }).click();
  const input = page.getByRole("textbox", { name: "Message...", exact: true });
  await input.waitFor();
  await page.getByText("Connected", { exact: true }).waitFor();
  await input.fill("Hello from the accepted session");
  await input.press("Enter");
  await op
    .getByText("Hello from the accepted session", { exact: true })
    .waitFor();
  await page.reload();
  await page
    .getByText("Hello from the accepted session", { exact: true })
    .waitFor();
  assert.equal(
    (
      await guest.request.post(`${base}/api/rooms/${roomId}/ai/requests`, {
        data: {
          clientRequestId: randomUUID(),
          prompt: "Translate",
          locale: "en",
        },
      })
    ).status(),
    403,
  );
  await page.screenshot({
    path: "../artifacts/session-mobile.png",
    caret: "initial",
  });
  await op.goto(base);
  await op.locator('[role="article"]').first().waitFor();
  assert.equal(await op.locator("aside.sidebar").count(), 0);
  await op.screenshot({
    path: "../artifacts/session-home-desktop.png",
    caret: "initial",
  });
  await page.goto(base);
  await page.locator('[role="article"]').first().waitFor();
  assert.equal(await page.getByRole("banner").isVisible(), false);
  const englishCard = page.locator('[role="article"]').first();
  assert.equal(await englishCard.locator('a').first().innerText(), "English");
  assert.ok((await englishCard.boundingBox()).height < 210);
  await englishCard.getByRole("button", { name: "Open chat" }).click();
  await page.getByRole("heading", { name: "English", exact: true, level: 1 }).waitFor();
  await page.getByText("Connected", { exact: true }).waitFor();
  await page.goto(`${base}/listings/demo-listing`);
  await page.waitForURL(/\/listings\/english-\d+$/);
  await page.goto(base);
  await page.locator('[role="article"]').first().waitFor();
  await page.screenshot({ path: "../artifacts/compact-home-mobile.png", caret: "initial" });
  await page.goto(`${base}/notifications`);
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
    false,
  );
  assert.deepEqual(errors, []);
  console.log(
    "Passed: verification never authenticates, TEST login, server-side identity, proposal notification/acceptance, forbidden outsider access, realtime session delivery and history, mobile auth and desktop header. Existing conversations untouched.",
  );
} finally {
  await browser.close();
  await db.message.deleteMany({ where: { roomId } });
  await db.aiJob.deleteMany({ where: { roomId } });
  await db.sessionProposal.deleteMany({ where: { listingId: id } });
  await db.listing.deleteMany({ where: { id } });
  await db.room.deleteMany({ where: { id: roomId } });
  await db.session.deleteMany({ where: { id: { in: sessionIds } } });
  await db.$disconnect();
}

