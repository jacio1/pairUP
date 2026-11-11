import { chromium } from "playwright";
import assert from "node:assert/strict";
import { readFile, mkdir } from "node:fs/promises";
import { createRequire } from "node:module";
const require = createRequire(
  new URL("../server/package.json", import.meta.url),
);
const { io } = require("socket.io-client");
const { parse } = require("dotenv");
const env = parse(
  await readFile(process.env.TEST_ENV_FILE || "../server/.env"),
);
const base = process.env.TEST_SITE_URL || "http://localhost:3000";
if (!/^https?:\/\/(localhost|127\.0\.0\.1):/.test(base))
  throw new Error("UI test only supports a local test site");
const errors = [];
// Self-signed TLS is permitted only by this loopback-only verification script.
const localTLS = base.startsWith("https://");
const browser = await chromium.launch({ channel: "msedge", headless: true });
const worker = io(process.env.TEST_WORKER_URL || "http://localhost:4000", {
  autoConnect: false,
  transports: ["websocket"],
  auth: {
    kind: "worker",
    secret: process.env.WORKER_SECRET || env.WORKER_SECRET,
  },
  rejectUnauthorized: !localTLS,
});
await mkdir("../artifacts", { recursive: true });
try {
  await new Promise((resolve, reject) => {
    const timer = setTimeout(
      () =>
        reject(
          new Error(
            "Test worker not accepted; stop your real worker before UI tests",
          ),
        ),
      5000,
    );
    worker.once("worker:ready", () => {
      clearTimeout(timer);
      resolve();
    });
    worker.connect();
  });
  worker.on("worker:job", (job) =>
    worker.emit("worker:result", {
      id: job.id,
      text: "Тестовый перевод: мы изучаем React вместе.",
    }),
  );
  const hostContext = await browser.newContext({
    ignoreHTTPSErrors: localTLS,
    locale: "en-US",
    viewport: { width: 1440, height: 1050 },
  });
  hostContext.setDefaultTimeout(15000);
  const host = await hostContext.newPage();
  host.on("pageerror", (e) => errors.push(e.message));
  await host.goto(base);
  await host
    .getByRole("heading", { name: /Find your study partner/ })
    .waitFor();
  assert.equal(await host.locator("html").getAttribute("lang"), "en");
  await host.screenshot({
    path: "../artifacts/desktop-en.png",
    fullPage: true,
    caret: "initial",
  });
  await host.getByRole("button", { name: "RU", exact: true }).click();
  await host
    .getByRole("heading", { name: /Найди напарника для учёбы/ })
    .waitFor();
  await host.reload();
  await host
    .getByRole("heading", { name: /Найди напарника для учёбы/ })
    .waitFor();
  await host.getByRole("button", { name: "EN", exact: true }).click();
  await host
    .getByRole("heading", { name: /Find your study partner/ })
    .waitFor();
  await host.goto(`${base}/profile`);
  await host
    .getByLabel("Host password")
    .fill(process.env.PRESENTER_PASSWORD || env.PRESENTER_PASSWORD);
  await host.getByRole("button", { name: "Sign in as host" }).click();
  await host.getByRole("heading", { name: "Presenter", exact: true }).waitFor();
  await host.getByRole("button", { name: /Open the conversation/ }).click();
  await host
    .locator(".chat-header p")
    .filter({ hasText: "Connected" })
    .waitFor();
  await host
    .getByRole("button", { name: "Clear conversation", exact: true })
    .click();
  await host
    .getByRole("dialog")
    .getByRole("button", { name: "Clear conversation", exact: true })
    .click();
  const guestContext = await browser.newContext({
    ignoreHTTPSErrors: localTLS,
    locale: "ru-RU",
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 1,
  });
  guestContext.setDefaultTimeout(15000);
  const guest = await guestContext.newPage();
  guest.on("pageerror", (e) => errors.push(e.message));
  await guest.goto(base);
  await guest
    .getByRole("heading", { name: /Найди напарника для учёбы/ })
    .waitFor();
  await guest.screenshot({
    path: "../artifacts/mobile-ru.png",
    fullPage: true,
    caret: "initial",
  });
  assert.equal(
    await guest.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
    true,
  );
  await guest.getByRole("button", { name: /Войти как TEST/ }).click();
  await guest
    .locator(".chat-header p")
    .filter({ hasText: "Подключено" })
    .waitFor();
  assert.equal(
    await guest
      .getByRole("button", { name: "Позвать Нейрона", exact: true })
      .count(),
    0,
  );
  const message = "We are studying React together.";
  await guest
    .getByRole("textbox", { name: "Поделись мыслью с группой…" })
    .fill(message);
  await guest
    .getByRole("button", { name: "Отправить сообщение", exact: true })
    .click();
  await host.getByText(message, { exact: true }).waitFor();
  await guest.getByRole("textbox").fill("Черновик сохранён");
  await guest.getByRole("button", { name: "EN", exact: true }).click();
  await guest
    .locator(".chat-header p")
    .filter({ hasText: "Connected" })
    .waitFor();
  assert.equal(
    await guest.getByRole("textbox").inputValue(),
    "Черновик сохранён",
  );
  await host.getByRole("textbox").fill("Normal draft");
  await host
    .getByRole("button", { name: "Ask Neuron about this message", exact: true })
    .last()
    .click();
  await host.getByRole("textbox").fill("Translate this into Russian");
  await host.getByRole("button", { name: "RU", exact: true }).click();
  await host.getByText("Выбранное сообщение", { exact: true }).waitFor();
  assert.equal(
    await host.getByRole("textbox").inputValue(),
    "Translate this into Russian",
  );
  await host.getByRole("button", { name: "Выйти из режима Нейрона" }).click();
  assert.equal(await host.getByRole("textbox").inputValue(), "Normal draft");
  await host
    .getByRole("button", { name: "Спросить Нейрона об этом сообщении" })
    .last()
    .click();
  assert.equal(
    await host.getByRole("textbox").inputValue(),
    "Translate this into Russian",
  );
  await host
    .getByRole("button", { name: "Отправить сообщение", exact: true })
    .click();
  await host
    .locator(".neuron-message")
    .getByText("Тестовый перевод: мы изучаем React вместе.", { exact: true })
    .waitFor();
  await guest
    .getByText("Тестовый перевод: мы изучаем React вместе.", { exact: true })
    .waitFor();
  assert.equal(await host.getByRole("textbox").inputValue(), "Normal draft");
  await guest.reload();
  await guest
    .locator(".chat-header p")
    .filter({ hasText: "Connected" })
    .waitFor();
  await guest.getByText(message, { exact: true }).first().waitFor();
  await guestContext.setOffline(true);
  await guest
    .locator(".chat-header p")
    .filter({ hasText: "Reconnecting" })
    .waitFor();
  await host
    .getByRole("textbox")
    .fill("A message sent while you were offline.");
  await host
    .getByRole("button", { name: "Отправить сообщение", exact: true })
    .click();
  await host
    .getByText("A message sent while you were offline.", { exact: true })
    .waitFor();
  await guestContext.setOffline(false);
  await guest
    .locator(".chat-header p")
    .filter({ hasText: "Connected" })
    .waitFor();
  await guest
    .getByText("A message sent while you were offline.", { exact: true })
    .waitFor();
  await guest.screenshot({
    path: "../artifacts/chat-mobile.png",
    fullPage: true,
    caret: "initial",
  });
  await host.screenshot({
    path: "../artifacts/chat-desktop.png",
    fullPage: true,
    caret: "initial",
  });
  assert.equal(
    await guest.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
    true,
  );
  const unsupported = await browser.newContext({
    locale: "de-DE",
    ignoreHTTPSErrors: localTLS,
  });
  const other = await unsupported.newPage();
  await other.goto(base);
  assert.equal(await other.locator("html").getAttribute("lang"), "en");
  await unsupported.close();
  assert.deepEqual(errors, []);
  console.log(
    "UI passed: language detection/persistence, desktop/mobile, TEST/Presenter, realtime, drafts/quote across locale changes, AI response and reload recovery. AI responses were test fixtures.",
  );
} catch (error) {
  let i = 0;
  for (const context of browser.contexts())
    for (const page of context.pages()) {
      await page.screenshot({
        path: `../artifacts/ui-failure-${i++}.png`,
        fullPage: true,
        caret: "initial",
      });
      console.error("Failed page:", page.url());
    }
  throw error;
} finally {
  worker.disconnect();
  await browser.close();
}
