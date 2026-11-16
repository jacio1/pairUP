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
  const loginPage = await a.newPage();
  await loginPage.goto(`${base}/profile`);
  await loginPage
    .getByRole("button", { name: en.Auth.login, exact: true })
    .click();
  const loginDialog = loginPage.getByRole("dialog");
  await loginDialog.locator("summary").click();
  await loginDialog
    .locator("details")
    .getByLabel(en.Auth.password, { exact: true })
    .fill(password);
  const loginResponse = loginPage.waitForResponse(
    (response) =>
      response.url() === `${base}/api/auth/presenter` &&
      response.request().method() === "POST",
  );
  await loginDialog
    .locator("details")
    .getByRole("button", { name: en.Auth.login, exact: true })
    .click();
  const owner = await check(await loginResponse);
  sessions.push(owner.id);
  assert.equal(owner.role, "presenter");
  await loginDialog.waitFor({ state: "hidden" });
  await loginPage.close();
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
  const input = pb.getByRole("textbox", {
    name: ru.Demo.messagePlaceholder,
    exact: true,
  });
  await input.fill("Hello, study partner!");
  await pb.getByRole("button", { name: ru.Demo.send, exact: true }).click();
  await pa
    .getByRole("log")
    .getByText("Hello, study partner!", { exact: true })
    .waitFor({ timeout: 15000 });
  console.log(
    "PASS: public HTTPS, secure cookies, Presenter/TEST, room invitation, RU/EN and WebSocket delivery.",
  );
  await pa
    .getByRole("button", { name: en.Demo.askNeuron, exact: true })
    .click();
  await pa
    .getByRole("textbox", { name: en.Demo.askPlaceholder, exact: true })
    .fill(
      "Translate the previous greeting into Russian. Reply with the translation only.",
    );
  await pa.getByRole("button", { name: en.Demo.send, exact: true }).click();
  let answer;
  for (let attempt = 0; attempt < 35; attempt++) {
    const snapshot = await check(
      await a.request.get(`${base}/api/rooms/${roomId}/messages`),
      200,
    );
    answer = snapshot.messages.find((m) => m.kind === "ai");
    if (answer) break;
    if (snapshot.ai?.status === "failed")
      throw Error(`AI failed: ${snapshot.ai.error}`);
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
  assert.ok(answer?.text?.trim(), "Local AI must return a shared response");
  await pb.getByRole("log").getByText(answer.text, { exact: true }).waitFor();
  await pb.reload();
  await pb.getByRole("log").getByText(answer.text, { exact: true }).waitFor();
  console.log(
    "PASS: local Ollama response reached both public browsers and persisted after reload.",
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
