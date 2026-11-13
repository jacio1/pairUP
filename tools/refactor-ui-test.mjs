import { chromium } from "playwright";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
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
const en = JSON.parse(
  await readFile(
    new URL("../client/messages/en.json", import.meta.url),
    "utf8",
  ),
);
const ru = JSON.parse(
  await readFile(
    new URL("../client/messages/ru.json", import.meta.url),
    "utf8",
  ),
);
const browser = await chromium.launch({ channel: "msedge", headless: true });
const host = await browser.newContext({
  locale: "en-US",
  viewport: { width: 1440, height: 900 },
});
const guest = await browser.newContext({ locale: "en-US" });
const base = "http://localhost:3000",
  ids = [randomUUID(), randomUUID()],
  rooms = ids.map((id) => `listing-${id}`),
  sessions = [];
const errors = [],
  liveSockets = new Set();
async function nextNavigation(page, method, ...args) {
  await page.evaluate(
    ({ method, args }) => window.next.router[method](...args),
    { method, args },
  );
  if (method === "push") await page.waitForURL(base + args[0]);
}
async function snapshot() {
  const r = await host.request.get(`${base}/api/rooms/${rooms[0]}/messages`);
  assert.equal(r.status(), 200);
  return r.json();
}
try {
  for (const [context, presenter] of [
    [host, true],
    [guest, false],
  ]) {
    const response = await context.request.post(
      `${base}/api/auth/${presenter ? "presenter" : "demo"}`,
      { data: presenter ? { password: process.env.PRESENTER_PASSWORD } : {} },
    );
    assert.equal(response.status(), 201);
    sessions.push((await response.json()).id);
  }
  for (const id of ids) {
    const response = await host.request.post(`${base}/api/listings`, {
      data: {
        id,
        title: `Refactor regression ${id.slice(0, 6)}`,
        subject: "english",
        level: "intermediate",
        goal: "Verify collaborative study",
        format: "online",
        schedule: "",
        location: "",
        description: "Isolated regression data for component extraction.",
        authorName: "Presenter",
      },
    });
    assert.equal(response.status(), 201);
  }
  const proposal = await (
    await guest.request.post(`${base}/api/listings/${ids[0]}/proposals`)
  ).json();
  assert.equal(
    (
      await host.request.post(`${base}/api/proposals/${proposal.id}/respond`, {
        data: { accept: true },
      })
    ).status(),
    201,
  );
  const page = await host.newPage(),
    other = await guest.newPage(),
    settings = await host.newPage();
  page.on("pageerror", (error) => errors.push(error.message));
  other.on("pageerror", (error) => errors.push(error.message));
  page.on("websocket", (socket) => {
    if (!socket.url().includes("socket.io")) return;
    liveSockets.add(socket);
    socket.on("close", () => liveSockets.delete(socket));
  });
  await Promise.all([
    page.goto(`${base}/messages/${rooms[0]}`),
    other.goto(`${base}/messages/${rooms[0]}`),
    settings.goto(`${base}/settings`),
  ]);
  await page.getByText(en.Demo.connected, { exact: true }).waitFor();
  await other.getByText(en.Demo.connected, { exact: true }).waitFor();
  assert.equal(liveSockets.size, 1);
  const normal = () =>
    page.getByRole("textbox", {
      name: en.Demo.messagePlaceholder,
      exact: true,
    });
  await normal().fill("The sky is blue.");
  await normal().press("Enter");
  await other.getByText("The sky is blue.", { exact: true }).waitFor();
  await normal().fill("Unsent normal draft");
  await host.setOffline(true);
  await page.evaluate(() => window.dispatchEvent(new Event("offline")));
  await page
    .getByRole("button", { name: en.Demo.send, exact: true })
    .isDisabled()
    .then((value) => assert.equal(value, true));
  await host.setOffline(false);
  await page.evaluate(() => window.dispatchEvent(new Event("online")));
  await page.getByText(en.Demo.connected, { exact: true }).waitFor();
  assert.equal(await normal().inputValue(), "Unsent normal draft");
  const article = page
    .locator("article")
    .filter({ has: page.getByText("The sky is blue.", { exact: true }) });
  await article.getByRole("button", { name: en.Demo.askAboutMessage }).click();
  const aiInput = () =>
    page.getByRole("textbox", { name: en.Demo.askPlaceholder, exact: true });
  await aiInput().fill(
    "Translate the selected message into Russian. Return only the translation.",
  );
  await settings
    .getByRole("radio", { name: en.Product.darkTheme, exact: true })
    .click();
  await page.waitForFunction(() =>
    document.documentElement.classList.contains("dark"),
  );
  assert.equal(
    await aiInput().inputValue(),
    "Translate the selected message into Russian. Return only the translation.",
  );
  await settings
    .getByRole("main")
    .getByRole("button", { name: "RU", exact: true })
    .click();
  await settings.waitForFunction(() => document.documentElement.lang === "ru");
  await nextNavigation(page, "refresh");
  await page.waitForFunction(() => document.documentElement.lang === "ru");
  const ruAI = page.getByRole("textbox", {
    name: ru.Demo.askPlaceholder,
    exact: true,
  });
  assert.equal(
    await ruAI.inputValue(),
    "Translate the selected message into Russian. Return only the translation.",
  );
  await page.getByText(ru.Demo.selectedMessage, { exact: true }).waitFor();
  assert.equal(liveSockets.size, 1);
  assert.equal(
    await other
      .getByRole("button", { name: en.Demo.askNeuron, exact: true })
      .isDisabled(),
    true,
  );
  await page.getByRole("button", { name: ru.Demo.send, exact: true }).click();
  const deadline = Date.now() + 100000;
  let result;
  while (Date.now() < deadline) {
    result = await snapshot();
    if (["completed", "failed"].includes(result.ai?.status)) break;
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  assert.equal(
    result.ai?.status,
    "completed",
    `AI did not complete: ${result.ai?.error || result.ai?.status}`,
  );
  const answers = result.messages.filter((message) => message.kind === "ai");
  assert.equal(answers.length, 1);
  assert.match(answers[0].text, /[А-Яа-яЁё]/);
  await other.getByText(answers[0].text, { exact: true }).waitFor();
  await page
    .getByRole("textbox", { name: ru.Demo.messagePlaceholder, exact: true })
    .waitFor();
  assert.equal(
    await page
      .getByRole("textbox", { name: ru.Demo.messagePlaceholder, exact: true })
      .inputValue(),
    "Unsent normal draft",
  );
  await nextNavigation(page, "push", `/messages/${rooms[1]}`);
  await page
    .getByRole("heading", {
      name: `Refactor regression ${ids[1].slice(0, 6)}`,
      exact: true,
      level: 1,
    })
    .waitFor();
  await page.getByText(ru.Demo.connected, { exact: true }).waitFor();
  assert.equal(
    await page.getByText("The sky is blue.", { exact: true }).count(),
    0,
  );
  assert.equal(
    await page
      .getByRole("textbox", { name: ru.Demo.messagePlaceholder, exact: true })
      .inputValue(),
    "",
  );
  assert.equal(liveSockets.size, 1);
  // Form state and first-error focus survive extraction and locale refresh.
  await nextNavigation(page, "push", "/create");
  await page.locator("#listing-title").waitFor();
  await page
    .getByRole("button", { name: ru.Product.publish, exact: true })
    .click();
  assert.equal(
    await page
      .locator("#listing-title")
      .evaluate((el) => el === document.activeElement),
    true,
  );
  await page.locator("#listing-title").fill("An unsent listing draft");
  await page.locator("#goal").fill("A persistent goal");
  await page.getByRole("group", { name: ru.Product.format }).count();
  await page
    .getByRole("radio", { name: ru.Product.offline, exact: true })
    .click();
  await page
    .getByRole("button", { name: ru.Product.publish, exact: true })
    .click();
  assert.equal(
    await page.locator("#location").getAttribute("aria-invalid"),
    "true",
  );
  await page
    .getByRole("radio", { name: ru.Product.online, exact: true })
    .click();
  assert.equal(await page.locator("#location").count(), 0);
  await page.getByRole("button", { name: "EN", exact: true }).click();
  await page.waitForFunction(() => document.documentElement.lang === "en");
  assert.equal(
    await page.locator("#listing-title").inputValue(),
    "An unsent listing draft",
  );
  assert.equal(await page.locator("#goal").inputValue(), "A persistent goal");
  assert.deepEqual(errors, []);
  console.log(
    "Passed: single socket, offline recovery, normal/AI drafts and quote across theme and RU/EN refresh, real AI translation to both participants, room isolation, listing validation and draft persistence.",
  );
} finally {
  await browser.close();
  await db.aiJob.deleteMany({ where: { roomId: { in: rooms } } });
  await db.message.deleteMany({ where: { roomId: { in: rooms } } });
  await db.sessionProposal.deleteMany({ where: { listingId: { in: ids } } });
  await db.listing.deleteMany({ where: { id: { in: ids } } });
  await db.room.deleteMany({ where: { id: { in: rooms } } });
  await db.publicProfile.deleteMany({ where: { sessionId: { in: sessions } } });
  await db.session.deleteMany({ where: { id: { in: sessions } } });
  await db.$disconnect();
}
