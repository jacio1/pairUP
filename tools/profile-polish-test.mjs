import assert from "node:assert/strict";
import { readFile, mkdir } from "node:fs/promises";
import { createRequire } from "node:module";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
const require = createRequire(import.meta.url),
  ru = require("../client/messages/ru.json"),
  en = require("../client/messages/en.json");
const env = await readFile(new URL("../.env.home", import.meta.url), "utf8");
const base = env.match(/^PUBLIC_ORIGIN=(.+)$/m)?.[1]?.trim();
assert.equal(base, "https://pair-up.ru");
const browser = await chromium.launch({ channel: "msedge", headless: true }),
  sessions = [];
const artifacts = fileURLToPath(
  new URL("../artifacts/profile-polish/", import.meta.url),
);
await mkdir(artifacts, { recursive: true });
try {
  for (const [language, width] of [
    ["ru", 390],
    ["en", 1440],
  ]) {
    const t = language === "ru" ? ru : en;
    const ctx = await browser.newContext({
      locale: language === "ru" ? "ru-RU" : "en-US",
      viewport: { width, height: 900 },
    });
    const response = await ctx.request.post(`${base}/api/auth/demo`, {
      data: {},
      headers: { Origin: base },
    });
    assert.equal(response.status(), 201);
    const session = await response.json();
    sessions.push(session.id);
    const page = await ctx.newPage();
    await page.goto(base);
    const listings = await (
        await ctx.request.get(`${base}/api/listings`)
      ).json(),
      english = listings.find((l) => l.id === "demo-listing");
    assert.equal(english.authorName, "EnglishVUZ");
    assert.equal(english.authorProfile.name, "EnglishVUZ");
    const card = page
      .getByRole("article")
      .filter({
        has: page.getByRole("link", { name: "English", exact: true }),
      });
    await card.getByText("EnglishVUZ", { exact: true }).waitFor();
    const size = await card.boundingBox();
    assert.ok(
      size.height < 280,
      `Short card should be compact: ${size.height}`,
    );
    const padding = await page
      .locator(".page-shell")
      .evaluate((el) => [
        getComputedStyle(el).paddingLeft,
        getComputedStyle(el).paddingRight,
      ]);
    assert.deepEqual(padding, ["8px", "8px"]);
    await page.screenshot({ path: `${artifacts}/listings-${language}.png` });
    await page.goto(`${base}/users/${english.authorProfile.id}`);
    await page
      .getByRole("heading", { name: "EnglishVUZ", exact: true })
      .waitFor();
    assert.equal(
      await page
        .getByRole("link", { name: new RegExp(t.SocialProfile.back) })
        .count(),
      0,
    );
    await page.goto(`${base}/profile`);
    const logout = page.getByRole("button", {
      name: t.Auth.logout,
      exact: true,
    });
    await logout.waitFor();
    assert.equal(
      await page.getByText(t.Demo.presenterLogin, { exact: true }).count(),
      0,
    );
    await logout.scrollIntoViewIfNeeded();
    await page.screenshot({ path: `${artifacts}/profile-${language}.png` });
    await page.route("**/api/auth/logout", (route) =>
      route.fulfill({
        status: 503,
        contentType: "application/json",
        body: JSON.stringify({ code: "SERVER_ERROR" }),
      }),
    );
    await logout.click();
    await page
      .getByRole("alert")
      .filter({ hasText: t.Errors.SERVER_ERROR })
      .waitFor();
    assert.equal(
      (await (await ctx.request.get(`${base}/api/me`)).json()).id,
      session.id,
    );
    await page.unroute("**/api/auth/logout");
    await logout.click();
    await page.waitForURL((url) => url.pathname === "/");
    const signedOut = await (await ctx.request.get(`${base}/api/me`)).text();
    assert.ok(signedOut === "" || signedOut === "null");
    assert.equal(
      (await ctx.request.get(`${base}/api/me/profile`)).status(),
      401,
    );
    assert.equal(
      (await ctx.cookies()).filter((c) => c.name === "PAIRUP_SESSION").length,
      0,
    );
    await page.goto(`${base}/profile`);
    await page
      .getByRole("heading", { name: t.Auth.required, exact: true })
      .waitFor();
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    );
    await ctx.close();
  }
  console.log(
    "PASS: mobile/desktop RU/EN profile logout, failed logout keeps session, secure session removal, no presenter block/back link, EnglishVUZ identity, compact card and 8px page padding.",
  );
} finally {
  await browser.close();
  const script = `const {PrismaClient}=require('@prisma/client');const db=new PrismaClient();const ids=JSON.parse(process.argv[1]);(async()=>{await db.publicProfile.deleteMany({where:{sessionId:{in:ids}}});await db.session.deleteMany({where:{id:{in:ids}}});await db.$disconnect();})().catch(e=>{console.error(e.message);process.exitCode=1;});`;
  const result = spawnSync(
    "docker",
    [
      "compose",
      "--env-file",
      ".env.home",
      "-f",
      "compose.home.yaml",
      "-f",
      "compose.home.permanent.yaml",
      "exec",
      "-T",
      "server",
      "node",
      "-e",
      script,
      JSON.stringify(sessions),
    ],
    { cwd: fileURLToPath(new URL("../", import.meta.url)), encoding: "utf8" },
  );
  if (result.status !== 0) throw Error("Test cleanup failed.");
}
