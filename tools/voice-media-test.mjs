// Isolated real-SFU smoke test. Start compose.voice.yaml first. No app DB/chat writes.
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { chromium } from "playwright";
const require = createRequire(
  new URL("../server/package.json", import.meta.url),
);
const {
  AccessToken,
  RoomServiceClient,
  TrackSource,
} = require("livekit-server-sdk");
const roomName = `voice-smoke-${crypto.randomUUID()}`;
const admin = new RoomServiceClient(
  "http://localhost:7880",
  "devkey",
  "secret",
);
const bundle = readFileSync(
  new URL(
    "../client/node_modules/livekit-client/dist/livekit-client.umd.js",
    import.meta.url,
  ),
);
const server = createServer((req, res) => {
  if (req.url === "/sdk.js") {
    res.setHeader("Content-Type", "text/javascript");
    res.end(bundle);
  } else {
    res.setHeader("Content-Type", "text/html");
    res.end('<script src="/sdk.js"></script>');
  }
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
let browser;
try {
  browser = await chromium.launch({
    channel: "msedge",
    headless: true,
    args: [
      "--use-fake-device-for-media-stream",
      "--use-fake-ui-for-media-stream",
      "--autoplay-policy=no-user-gesture-required",
    ],
  });
  const pages = [];
  for (const identity of ["sender", "listener"]) {
    const context = await browser.newContext({ permissions: ["microphone"] });
    const page = await context.newPage();
    await page.goto(`http://127.0.0.1:${server.address().port}`);
    const token = new AccessToken("devkey", "secret", { identity, ttl: 120 });
    token.addGrant({
      room: roomName,
      roomJoin: true,
      canPublish: true,
      canPublishSources: [TrackSource.MICROPHONE],
      canSubscribe: true,
      canPublishData: false,
    });
    await page.evaluate(
      async (jwt) => {
        window.voice = new LivekitClient.Room();
        window.received = [];
        voice.on(LivekitClient.RoomEvent.TrackSubscribed, (track) => {
          received.push(track);
          document.body.append(track.attach());
        });
        await voice.connect("ws://localhost:7880", jwt);
        await voice.startAudio();
      },
      await token.toJwt(),
    );
    pages.push(page);
  }
  await pages[0].evaluate(() =>
    voice.localParticipant.setMicrophoneEnabled(true),
  );
  await pages[1].waitForFunction(
    async () => {
      const stats = await received[0]?.getRTCStatsReport();
      return (
        stats &&
        [...stats.values()].some(
          (s) => s.type === "inbound-rtp" && s.bytesReceived > 0,
        )
      );
    },
    undefined,
    { timeout: 20000 },
  );
  assert.equal(await pages[1].evaluate(() => voice.remoteParticipants.size), 1);
  await pages[0].evaluate(() =>
    voice.localParticipant.setMicrophoneEnabled(false),
  );
  await pages[1].waitForFunction(
    () =>
      [...voice.remoteParticipants.values()][0]?.isMicrophoneEnabled === false,
  );
  await pages[0].evaluate(() => voice.disconnect());
  await pages[1].waitForFunction(() => voice.remoteParticipants.size === 0);
  console.log(
    "PASS: two browsers, real audio packets through SFU, mute propagation and leave.",
  );
} finally {
  await browser?.close();
  await admin.deleteRoom(roomName).catch(() => {});
  server.closeAllConnections();
  await new Promise((resolve) => server.close(resolve));
}
