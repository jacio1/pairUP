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
const en = require("../client/messages/en.json"),
  ru = require("../client/messages/ru.json");
const db = new PrismaClient(),
  browser = await chromium.launch({ channel: "msedge", headless: true });
const a = await browser.newContext({
    locale: "en-US",
    viewport: { width: 1440, height: 1000 },
  }),
  b = await browser.newContext({
    locale: "ru-RU",
    viewport: { width: 390, height: 844 },
  }),
  guest = await browser.newContext({
    locale: "en-US",
    viewport: { width: 1440, height: 1000 },
  });
const sessions = [],
  listings = [],
  rooms = [],
  errors = [];
const base = "http://localhost:3000";
const req = (ctx, path, data) =>
  data === undefined
    ? ctx.request.get(`${base}/api${path}`)
    : ctx.request.post(`${base}/api${path}`, { data });
async function json(response, status = 200) {
  assert.equal(response.status(), status, await response.text());
  return response.json();
}
const draft = {
  name: "Alex Rivera",
  bio: "Frontend student. I enjoy learning with others and turning difficult topics into small practical steps.",
  interests: "React, TypeScript, English",
  goal: "Build a study app together",
  availability: "Weekdays after 18:00",
  avatar: "teal",
  version: 0,
};
async function createListing(title, long = false) {
  const id = crypto.randomUUID();
  listings.push(id);
  rooms.push(`listing-${id}`);
  return json(
    await req(a, "/listings", {
      id,
      title,
      description: long
        ? "Let’s practice together and review our progress. ".repeat(20)
        : "A friendly session for practical study.",
      subject: "computerScience",
      level: "intermediate",
      goal: long
        ? "Work through difficult examples together and compare our solutions and approaches to learning"
        : "Practice React",
      format: "online",
      schedule: long
        ? "Every Tuesday and Thursday, evenings after 18:00"
        : "Weekends",
      location: "",
      authorName: "Ignore client name",
    }),
    201,
  );
}
async function cardHeights(page, expected) {
  await page.getByRole("article").first().waitFor();
  const bounds = await page.getByRole("article").evaluateAll((nodes) =>
    nodes.map((node) => {
      const r = node.getBoundingClientRect();
      return {
        height: r.height,
        bottom: r.bottom,
        actions: [...node.querySelectorAll("button,a")].map(
          (el) => el.getBoundingClientRect().bottom,
        ),
      };
    }),
  );
  assert.ok(bounds.length >= 2);
  for (const r of bounds) {
    assert.equal(Math.round(r.height), expected);
    assert.ok(r.actions.every((bottom) => bottom <= r.bottom));
  }
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
    false,
  );
}
try {
  for (const ctx of [a, b])
    sessions.push((await json(await req(ctx, "/auth/demo", {}), 201)).id);
  assert.equal((await req(guest, "/me/profile")).status(), 401);
  assert.equal((await req(guest, "/me/profile", draft)).status(), 401);
  const mine = await json(await req(a, "/me/profile")),
    other = await json(await req(b, "/me/profile"));
  assert.notEqual(mine.id, other.id);
  let saved = await json(await req(a, "/me/profile", draft), 201);
  assert.equal(saved.name, draft.name);
  await json(
    await req(b, "/me/profile", {
      ...draft,
      id: mine.id,
      name: "Other student",
    }),
    201,
  );
  assert.equal(
    (await json(await req(guest, `/profiles/${mine.id}`))).name,
    draft.name,
  );
  const first = await createListing("React study session"),
    second = await createListing(
      "Learning TypeScript together with plenty of examples and challenging exercises",
      true,
    );
  const publicView = await json(await req(guest, `/profiles/${mine.id}`));
  assert.equal(publicView._count.listings, 2);
  assert.equal(publicView.listings.length, 2);
  for (const secret of [
    "sessionId",
    "seedKey",
    "tokenHash",
    "userId",
    "expiresAt",
    "email",
  ])
    assert.ok(!(secret in publicView));
  assert.ok(
    publicView.listings.every(
      (item) =>
        item.authorProfile.id === mine.id &&
        item.authorProfile.avatar === "teal",
    ),
  );
  assert.equal((await req(guest, "/profiles/999999999")).status(), 404);
  assert.equal(
    (
      await req(a, "/me/profile", {
        ...draft,
        version: 1,
        bio: "x".repeat(501),
      })
    ).status(),
    400,
  );
  const pa = await a.newPage(),
    pg = await guest.newPage(),
    pb = await b.newPage();
  for (const page of [pa, pg, pb])
    page.on("pageerror", (e) => errors.push(e.message));
  await pa.goto(`${base}/profile`);
  await pa.getByRole("heading", { name: draft.name, exact: true }).waitFor();
  await pa
    .getByRole("button", { name: en.Product.editProfile, exact: true })
    .click();
  let dialog = pa.getByRole("dialog");
  await dialog.locator("#display-name").fill("Cancelled change");
  await dialog
    .getByRole("button", { name: en.Demo.cancel, exact: true })
    .click();
  assert.equal((await json(await req(a, "/me/profile"))).name, draft.name);
  await pa
    .getByRole("button", { name: en.Product.editProfile, exact: true })
    .click();
  await dialog.locator("#display-name").fill("Alex Morgan");
  await dialog
    .getByRole("button", { name: en.Product.saveProfile, exact: true })
    .click();
  await pa.getByRole("heading", { name: "Alex Morgan", exact: true }).waitFor();
  saved = await json(await req(a, "/me/profile"));
  assert.equal(saved.version, 2);
  await pa.getByRole("button", { name: en.Product.editProfile, exact: true }).click();
  await dialog.locator("#profile-bio").fill("A draft that must survive a network error");
  await pa.route("**/api/me/profile", route => route.request().method() === "POST" ? route.abort() : route.continue());
  await dialog.getByRole("button", { name: en.Product.saveProfile, exact: true }).click();
  await dialog.getByRole("alert").filter({hasText:en.SocialProfile.SERVER_ERROR}).waitFor();
  assert.equal(await dialog.locator("#profile-bio").inputValue(), "A draft that must survive a network error");
  assert.equal((await json(await req(a, "/me/profile"))).bio, draft.bio);
  await pa.unroute("**/api/me/profile");
  await dialog.getByRole("button", { name: en.Demo.cancel, exact: true }).click();
  const refreshed = await json(await req(guest, "/listings"));
  assert.equal(
    refreshed.find((item) => item.id === first.id).authorName,
    "Alex Morgan",
  );
  await pg.goto(base);
  await cardHeights(pg, 352);
  const article = pg.getByRole("article").filter({ hasText: first.title });
  await article.locator(`a[href="/users/${mine.id}"]`).click();
  await pg.getByRole("heading", { name: "Alex Morgan", exact: true }).waitFor();
  assert.equal(
    await pg
      .getByRole("button", { name: en.Product.editProfile, exact: true })
      .count(),
    0,
  );
  await pg.getByText("TypeScript", { exact: true }).waitFor();
  await pg.screenshot({
    path: "artifacts/public-profile-desktop.png",
    fullPage: true,
    animations: "disabled",
  });
  await pa.screenshot({
    path: "artifacts/own-profile-desktop.png",
    fullPage: true,
    animations: "disabled",
  });
  await pg
    .getByRole("article")
    .filter({ hasText: first.title })
    .locator('a[href^="/listings/"]')
    .first()
    .click();
  await pg.getByRole("heading", { name: first.title, exact: true }).waitFor();
  await pg.locator(`main a[href="/users/${mine.id}"]`).click();
  await pg.getByRole("heading", { name: "Alex Morgan", exact: true }).waitFor();
  await pb.goto(`${base}/users/${mine.id}`);
  await pb.getByRole("heading", { name: "Alex Morgan", exact: true }).waitFor();
  assert.equal(
    await pb
      .getByRole("link", { name: ru.SocialProfile.myProfile, exact: true })
      .count(),
    0,
  );
  await pb.screenshot({
    path: "artifacts/public-profile-mobile.png",
    fullPage: true,
    animations: "disabled",
  });
  assert.equal(
    await pb.evaluate(() => document.documentElement.scrollWidth > innerWidth),
    false,
  );
  await pb.goto(base);
  await cardHeights(pb, 340);
  await pb.screenshot({
    path: "artifacts/fixed-cards-mobile.png",
    fullPage: true,
    animations: "disabled",
  });
  await pg.goto(base);
  await pg.evaluate(() => {
    localStorage.setItem("theme", "dark");
    location.reload();
  });
  await cardHeights(pg, 352);
  await pg.screenshot({
    path: "artifacts/fixed-cards-desktop-dark.png",
    fullPage: true,
    animations: "disabled",
  });
  // A stale second editor cannot overwrite a more recent profile save.
  const results = await Promise.all([
    req(a, "/me/profile", {
      ...draft,
      name: "Latest A",
      version: saved.version,
    }),
    req(a, "/me/profile", {
      ...draft,
      name: "Latest B",
      version: saved.version,
    }),
  ]);
  assert.deepEqual(results.map((r) => r.status()).sort(), [201, 409]);
  await json(await req(a, "/auth/logout", {}), 201);
  assert.equal((await req(a, "/me/profile")).status(), 401);
  assert.equal((await req(guest, `/profiles/${mine.id}`)).status(), 200);
  await pg.goto(`${base}/users/999999999`);
  await pg
    .getByRole("heading", { name: en.SocialProfile.notFound, exact: true })
    .waitFor();
  assert.deepEqual(errors, []);
  console.log(
    "PASS: fixed card heights and visible actions; server profiles; public card/detail links; private editing; save/cancel; name/avatar propagation; isolation, privacy, version conflicts; RU/EN, desktop/mobile and dark theme.",
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
