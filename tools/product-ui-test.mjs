import { chromium } from "playwright";
import assert from "node:assert/strict";
import { readFile, mkdir } from "node:fs/promises";
const en = JSON.parse(await readFile("../client/messages/en.json", "utf8"));
const ru = JSON.parse(await readFile("../client/messages/ru.json", "utf8"));
const browser = await chromium.launch({ channel: "msedge", headless: true });
const errors = [];
async function assertPrimaryColour(page, expected) {
  const difference = await page.evaluate((colour) => {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 1;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = colour;
    ctx.fillRect(0, 0, 1, 1);
    const reference = [...ctx.getImageData(0, 0, 1, 1).data];
    ctx.clearRect(0, 0, 1, 1);
    ctx.fillStyle = getComputedStyle(document.documentElement)
      .getPropertyValue("--primary")
      .trim();
    ctx.fillRect(0, 0, 1, 1);
    return Math.max(
      ...[...ctx.getImageData(0, 0, 1, 1).data].map((value, index) =>
        Math.abs(value - reference[index]),
      ),
    );
  }, expected);
  assert.ok(
    difference <= 1,
    "Primary colour must match the original shadcn palette",
  );
}
await mkdir("../artifacts", { recursive: true });
try {
  const context = await browser.newContext({
    locale: "en-US",
    colorScheme: "light",
    viewport: { width: 1440, height: 1050 },
  });
  context.setDefaultTimeout(15000);
  await context.addInitScript(() => {
    if (localStorage.getItem("theme") === null)
      localStorage.setItem("theme", "dark");
  });
  const page = await context.newPage();
  page.on("pageerror", (e) => errors.push(e.message));
  page.on('console', message => {if(message.type()==='error' && /hydrat|didn't match/i.test(message.text())) errors.push(message.text());});
  await page.goto("http://localhost:3000");
  await page
    .getByRole("heading", { name: en.Product.discoverTitle, exact: true })
    .waitFor();
  await page.waitForFunction(() =>
    document.documentElement.classList.contains("dark"),
  );
  assert.equal(await page.getByText("Live demo", { exact: true }).count(), 0);
  assert.equal(await page.locator(".site-footer").count(), 0);
  assert.equal(
    await page
      .locator(".privacy-notice,.research-note,.host-only-note")
      .count(),
    0,
  );
  await assertPrimaryColour(page, "oklch(0.424 0.199 265.638)");
  await page
    .getByRole("textbox", { name: en.Product.searchListings, exact: true })
    .fill("React");
  await page
    .getByRole("combobox", { name: en.Product.subject, exact: true })
    .selectOption("math");
  await page
    .getByRole("button", { name: en.Product.searchButton, exact: true })
    .click();
  assert.equal(await page.locator(".listing-card").count(), 1);
  await page
    .getByRole("radio", { name: en.Product.darkTheme, exact: true })
    .click();
  await page.waitForFunction(() =>
    document.documentElement.classList.contains("dark"),
  );
  await page.screenshot({
    path: "../artifacts/product-dark-desktop.png",
    fullPage: true,
    caret: "initial",
  });
  await page.reload();
  await page.waitForFunction(() =>
    document.documentElement.classList.contains("dark"),
  );
  await page.goto("http://localhost:3000/create");
  await page
    .getByLabel(en.Product.title, { exact: true })
    .fill("React study group");
  await page
    .getByLabel(en.Product.subject, { exact: true })
    .selectOption("computerScience");
  await page
    .getByLabel(en.Product.level, { exact: true })
    .selectOption("beginner");
  await page
    .getByLabel(en.Product.goal, { exact: true })
    .fill("Understand hooks");
  assert.equal(
    await page.getByRole("button", { name: "Save draft", exact: true }).count(),
    0,
  );
  const alert = page.waitForEvent("dialog").then(async (dialog) => {
    assert.equal(dialog.message(), en.Product.publishUnavailable);
    await dialog.accept();
  });
  await Promise.all([
    alert,
    page.getByRole("button", { name: en.Product.publish, exact: true }).click(),
  ]);
  await page.getByRole("button", { name: "RU", exact: true }).click();
  await page
    .getByRole("heading", { name: ru.Product.create, exact: true })
    .waitFor();
  assert.equal(
    await page.getByLabel(ru.Product.title, { exact: true }).inputValue(),
    "React study group",
  );
  await page.reload();
  assert.equal(
    await page.getByLabel(ru.Product.title, { exact: true }).inputValue(),
    "",
  );
  await page.screenshot({
    path: "../artifacts/product-dark-create.png",
    fullPage: true,
    caret: "initial",
  });
  await page.goto("http://localhost:3000/my-listings");
  await page
    .getByRole("heading", { name: ru.Product.noListings, exact: true })
    .waitFor();
  await page.goto("http://localhost:3000/profile");
  await page
    .getByRole("button", { name: ru.Product.editProfile, exact: true })
    .click();
  await page.getByLabel(ru.Product.displayName, { exact: true }).fill("Alex");
  await page
    .getByLabel(ru.Product.interests, { exact: true })
    .fill("React, TypeScript");
  await page
    .getByRole("button", { name: ru.Product.saveProfile, exact: true })
    .click();
  await page.getByText(ru.Product.profileSaved, { exact: true }).waitFor();
  await page.reload();
  await page.getByRole("heading", { name: "Alex", exact: true }).waitFor();
  await page.getByText("React, TypeScript", { exact: true }).waitFor();
  await page.goto("http://localhost:3000/");
  await page
    .getByRole("button", { name: ru.Product.addFavorite, exact: true })
    .click();
  await page.goto("http://localhost:3000/favorites");
  await page
    .getByRole("heading", { name: ru.Demo.listingTitle, exact: true })
    .waitFor();
  await page.goto("http://localhost:3000/messages");
  await page.locator(".conversation-card").waitFor();
  await page.locator(".conversation-card").click();
  await page
    .getByRole("button", { name: ru.Demo.tryTest, exact: false })
    .click();
  await page
    .locator(".chat-header [role=status]")
    .filter({ hasText: ru.Demo.connected })
    .waitFor();
  assert.ok(page.url().endsWith("/messages/study-group"));
  assert.equal(await page.locator(".composer textarea").count(), 0);
  assert.equal(
    await page.getByRole("textbox").evaluate((element) => element.tagName),
    "INPUT",
  );
  assert.equal(
    await page
      .locator(".chat-info")
      .getByText(ru.Demo.privacy || "Это общий чат учебной группы.", {
        exact: true,
      })
      .count(),
    0,
  );
  await page.getByRole("textbox").fill("Draft preserved across theme changes");
  await page
    .getByRole("radio", { name: ru.Product.lightTheme, exact: true })
    .click();
  assert.equal(
    await page.getByRole("textbox").inputValue(),
    "Draft preserved across theme changes",
  );
  await page
    .getByRole("radio", { name: ru.Product.darkTheme, exact: true })
    .click();
  await page.getByRole("button", { name: "EN", exact: true }).click();
  await page
    .locator(".chat-header [role=status]")
    .filter({ hasText: en.Demo.connected })
    .waitFor();
  assert.equal(
    await page.getByRole("textbox").inputValue(),
    "Draft preserved across theme changes",
  );
  await page.screenshot({
    path: "../artifacts/product-dark-chat.png",
    fullPage: true,
    caret: "initial",
  });
  await page.goto("http://localhost:3000/notifications");
  await page
    .getByRole("heading", { name: en.Product.notifications, exact: true })
    .waitFor();
  assert.ok((await page.locator(".notification-row").count()) <= 1);
  const read = page.getByRole("button", {
    name: en.Product.markAllRead,
    exact: true,
  });
  if (await read.count()) {
    await read.click();
    assert.equal(await page.locator(".notification-row.unread").count(), 0);
    await page.reload();
    assert.equal(await page.locator(".notification-row.unread").count(), 0);
  }
  for (const path of [
    "settings",
    "sessions",
    "my-listings",
    "favorites",
    "profile",
  ]) {
    await page.goto("http://localhost:3000/" + path);
    assert.equal(
      await page.getByText("Research prototype", { exact: true }).count(),
      0,
    );
  }
  await page.goto("http://localhost:3000/settings");
  await page.emulateMedia({ colorScheme: "dark" });
  await page
    .getByRole("radio", { name: en.Product.systemTheme, exact: true })
    .last()
    .click();
  await page.waitForFunction(() =>
    document.documentElement.classList.contains("dark"),
  );
  await page.emulateMedia({ colorScheme: "light" });
  await page.waitForFunction(() =>
    document.documentElement.classList.contains("light"),
  );
  await assertPrimaryColour(page, "oklch(0.488 0.243 264.376)");
  await page.goto("http://localhost:3000/");
  await page.screenshot({
    path: "../artifacts/product-light-desktop.png",
    fullPage: true,
    caret: "initial",
  });
  const mobile = await browser.newContext({
    locale: "ru-RU",
    colorScheme: "dark",
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  mobile.setDefaultTimeout(15000);
  const phone = await mobile.newPage();
  phone.on("pageerror", (e) => errors.push(e.message));
  phone.on('console', message => {if(message.type()==='error' && /hydrat|didn't match/i.test(message.text())) errors.push(message.text());});
  for (const path of [
    "/",
    "/create",
    "/messages",
    "/notifications",
    "/profile",
    "/settings",
  ]) {
    await phone.goto("http://localhost:3000" + path);
    await phone.waitForFunction(() =>
      document.documentElement.classList.contains("dark"),
    );
    assert.equal(
      await phone.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      true,
    );
  }
  await phone.goto("http://localhost:3000/");
  await phone.screenshot({
    path: "../artifacts/product-dark-mobile.png",
    fullPage: true,
    caret: "initial",
  });
  await phone
    .getByRole("link", { name: ru.Product.create, exact: true })
    .last()
    .click();
  await phone
    .getByRole("heading", { name: ru.Product.create, exact: true })
    .waitFor();
  assert.equal(await phone.locator(".mobile-nav a").count(), 5);
  await phone.goto("http://localhost:3000/messages/study-group");
  await phone
    .getByRole("button", { name: ru.Demo.tryTest, exact: false })
    .click();
  await phone
    .locator(".chat-header [role=status]")
    .filter({ hasText: ru.Demo.connected })
    .waitFor();
  const composer = await phone.locator(".composer").boundingBox();
  const mobileNav = await phone.locator(".mobile-nav").boundingBox();
  assert.ok(
    composer.y + composer.height <= mobileNav.y,
    "Mobile navigation must not cover the composer",
  );
  await phone.screenshot({
    path: "../artifacts/product-chat-mobile.png",
    fullPage: true,
    caret: "initial",
  });
  assert.deepEqual(errors, []);
  console.log(
    "Passed: original shadcn colours, theme persistence, mock search/filters, publication alert, grouped notifications, input composer, no notices/footer, profile/favorites, locale switching and mobile layouts. No chat messages were sent or deleted.",
  );
} catch (error) {
  let i = 0;
  for (const c of browser.contexts())
    for (const p of c.pages()) {
      await p
        .screenshot({
          path: `../artifacts/product-failure-${i++}.png`,
          fullPage: true,
          caret: "initial",
          timeout: 3000,
        })
        .catch(() => {});
      console.error("Failed page:", p.url());
    }
  throw error;
} finally {
  await browser.close();
}
