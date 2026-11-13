// UI integration with isolated API fixtures and a real local SFU. No database writes.
import { chromium } from "playwright";
import { createRequire } from "node:module";
import assert from "node:assert/strict";
const require = createRequire(
  new URL("../server/package.json", import.meta.url),
);
const {
  AccessToken,
  TrackSource,
  RoomServiceClient,
} = require("livekit-server-sdk");
const roomId = `voice-ui-${crypto.randomUUID()}`;
const admin = new RoomServiceClient(
  "http://localhost:7880",
  "devkey",
  "secret",
);
const browser = await chromium.launch({
  channel: "msedge",
  headless: true,
  args: [
    "--use-fake-device-for-media-stream",
    "--use-fake-ui-for-media-stream",
    "--autoplay-policy=no-user-gesture-required",
  ],
});
try {
  const pages = [];
  for (const id of [901, 902]) {
    const context = await browser.newContext({
      permissions: ["microphone"],
      viewport: { width: id === 901 ? 1280 : 390, height: 844 },
    });
    await context.addCookies([
      { name: "NEXT_LOCALE", value: "en", domain: "localhost", path: "/" },
    ]);
    const page = await context.newPage();
    await page.route("**/api/**", async (route) => {
      const path = new URL(route.request().url()).pathname;
      let json = {};
      if (path === "/api/me") json = { id, name: `TEST #${id}`, role: "guest" };
      else if (path === "/api/listings")
        json = [
          {
            id: "demo-listing",
            publicId: 1,
            roomId,
            title: "English",
            description: "English",
            authorName: "Alex",
            subject: "english",
            level: "intermediate",
            goal: "English",
            format: "online",
            schedule: "",
            location: "",
            createdAt: new Date().toISOString(),
          },
        ];
      else if (path === "/api/proposals") json = [];
      else if (path.endsWith("/messages"))
        json = { messages: [], generation: 0, hasMore: false, ai: null };
      else if (path.endsWith("/voice/token")) {
        const token = new AccessToken("devkey", "secret", {
          identity: `ui-${id}`,
          name: `TEST #${id}`,
          ttl: 120,
        });
        token.addGrant({
          room: roomId,
          roomJoin: true,
          canSubscribe: true,
          canPublish: true,
          canPublishSources: [TrackSource.MICROPHONE],
          canPublishData: false,
        });
        json = {
          url: "ws://localhost:7880",
          token: await token.toJwt(),
          expiresAt: new Date(Date.now() + 60000).toISOString(),
        };
      }
      await route.fulfill({ json });
    });
    await page.goto(`http://localhost:3000/messages/${roomId}`);
    await page.getByRole("button", { name: "Join voice", exact: true }).click();
    await page
      .getByRole("button", { name: "Enable microphone", exact: true })
      .waitFor();
    pages.push(page);
  }
  await pages[0]
    .getByRole("button", { name: "Enable microphone", exact: true })
    .click();
  await pages[0].getByRole("button", { name: "Mute", exact: true }).waitFor();
  await pages[1]
    .getByRole("list", { name: "Voice participants" })
    .getByText("TEST #901")
    .waitFor();
  assert.equal(
    await pages[1].evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
    false,
  );
  await pages[0]
    .getByRole("button", { name: "Leave voice", exact: true })
    .click();
  await pages[0]
    .getByRole("button", { name: "Join voice", exact: true })
    .waitFor();
  await pages[1].waitForFunction(
    () =>
      !document
        .querySelector('[aria-label="Voice participants"]')
        ?.textContent.includes("TEST #901"),
  );
  console.log(
    "PASS: actual voice UI on desktop/mobile, join, microphone, participants, leave, no horizontal overflow.",
  );
} finally {
  await browser.close();
  await admin.deleteRoom(roomId).catch(() => {});
}
