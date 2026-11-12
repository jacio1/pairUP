import { test } from "node:test";
import assert from "node:assert/strict";
import {
  bindChatSocket,
  sendChatMessage,
} from "../client/src/lib/chat-transport.ts";

function socket() {
  const sent = [];
  return {
    connected: true,
    sent,
    timeout(ms) {
      assert.equal(ms, 8000);
      return this;
    },
    emit(event, payload, acknowledge) {
      sent.push({ event, payload });
      acknowledge(null, { ok: true });
    },
  };
}

test("disconnected transport reports delivery failure instead of leaving a pending send", () => {
  let error;
  sendChatMessage({ text: "Hello", clientRequestId: "request" }, (e) => {
    error = e;
  });
  assert.equal(error?.message, "DISCONNECTED");
});

test("cleanup for an old connection cannot release its replacement", () => {
  const old = socket(),
    current = socket();
  const releaseOld = bindChatSocket(old),
    releaseCurrent = bindChatSocket(current);
  releaseOld();
  const payload = { text: "Hello", clientRequestId: "same-id-on-retry" };
  sendChatMessage(payload, (error, result) => {
    assert.equal(error, null);
    assert.equal(result.ok, true);
  });
  assert.deepEqual(current.sent, [{ event: "message:send", payload }]);
  assert.deepEqual(old.sent, []);
  releaseCurrent();
  sendChatMessage(payload, (error) =>
    assert.equal(error?.message, "DISCONNECTED"),
  );
});
