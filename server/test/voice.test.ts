import { test } from "node:test";
import assert from "node:assert/strict";
import { TokenVerifier } from "livekit-server-sdk";
import { VoiceService } from "../src/voice";
import { HttpException } from "@nestjs/common";

test("voice tokens are short-lived, room-scoped and microphone-only", async () => {
  const previous = { ...process.env };
  try {
    process.env.LIVEKIT_URL = "ws://localhost:7880";
    process.env.LIVEKIT_API_KEY = "testkey";
    process.env.LIVEKIT_API_SECRET = "test-secret-long-enough-for-unit-tests";
    const expiry = new Date(Date.now() + 60000);
    const result = await new VoiceService().token(
      "private-room",
      { id: 42, name: "TEST #42" },
      expiry,
    );
    const claims = await new TokenVerifier(
      process.env.LIVEKIT_API_KEY,
      process.env.LIVEKIT_API_SECRET,
    ).verify(result.token);
    assert.equal(claims.sub, "session-42");
    assert.equal(claims.video?.room, "pairup-private-room");
    assert.deepEqual(claims.video?.canPublishSources, ["microphone"]);
    assert.equal(claims.video?.canPublishData, false);
    assert.equal(claims.video?.roomJoin, true);
    assert.ok(claims.exp! - claims.nbf! <= 60);
    assert.equal(result.expiresAt, expiry.toISOString());
    delete process.env.LIVEKIT_API_SECRET;
    await assert.rejects(
      () => new VoiceService().token("room", { id: 42, name: "TEST" }, expiry),
      (error: unknown) =>
        error instanceof HttpException &&
        error.getStatus() === 503 &&
        (error.getResponse() as { code: string }).code === "VOICE_UNAVAILABLE",
    );
  } finally {
    for (const key of [
      "LIVEKIT_URL",
      "LIVEKIT_API_KEY",
      "LIVEKIT_API_SECRET",
    ]) {
      if (previous[key] === undefined) delete process.env[key];
      else process.env[key] = previous[key];
    }
  }
});
