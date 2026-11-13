import { test } from "node:test";
import assert from "node:assert/strict";
import {
  RateLimiter,
  buildContext,
  secretEquals,
  validId,
  validText,
} from "../src/core";
import { resolveLocale } from "../../client/src/i18n/locale";
import en from "../../client/messages/en.json";
import ru from "../../client/messages/ru.json";
import { createStore, actions, type Message } from "../../client/src/lib/store";

test("locale preference: cookie, weighted regional languages, unsupported fallback", () => {
  assert.equal(resolveLocale("ru", "en-US"), "ru");
  assert.equal(resolveLocale("en", "ru-RU"), "en");
  assert.equal(
    resolveLocale(undefined, "fr;q=1,en-US;q=0.7,ru-RU;q=0.9"),
    "ru",
  );
  assert.equal(resolveLocale(undefined, "ru;q=0,en;q=0.4"), "en");
  assert.equal(resolveLocale("invalid", "de-DE"), "en");
  assert.equal(resolveLocale(undefined, "ru;q=no,en;q=0.8"), "en");
  assert.equal(resolveLocale(undefined, "en-US;q=0.5,ru-RU;q=0.5"), "en");
});
test("both dictionaries expose exactly the same translated keys", () => {
  for (const key of [
    "Demo",
    "Product",
    "Errors",
    "Navigation",
    "Auth",
    "Flow",
    "Voice",
  ] as const)
    assert.deepEqual(Object.keys(en[key]).sort(), Object.keys(ru[key]).sort());
  for (const text of Object.values(ru.Demo)) assert.ok(text.trim());
});
test("context isolates instruction and trims older records", () => {
  const messages = buildContext(
    Array.from({ length: 30 }, (_, i) => ({
      author: `TEST #${i}`,
      text: "x".repeat(1000),
      kind: "human",
    })),
    "Translate to Russian",
    "en",
  );
  assert.ok(messages[1].content.length < 12100);
  assert.ok(messages[1].content.includes("TEST #29"));
  assert.ok(!messages[1].content.includes("TEST #0"));
  assert.match(messages[0].content, /untrusted/);
  assert.match(messages[2].content, /Translate to Russian/);
});
test("rate limit boundary and request validation", () => {
  const limit = new RateLimiter();
  assert.equal(limit.allow("a", 2, 1000, 0), true);
  assert.equal(limit.allow("a", 2, 1000, 1), true);
  assert.equal(limit.allow("a", 2, 1000, 2), false);
  assert.equal(limit.allow("b", 2, 1000, 2), true);
  assert.equal(limit.allow("a", 2, 1000, 1001), true);
  assert.equal(validId("../bad"), false);
  assert.equal(validText(" ", 1000), false);
  assert.equal(validText("x".repeat(1001), 1000), false);
  assert.equal(secretEquals("secret", "secret"), true);
  assert.equal(secretEquals("secret", "other"), false);
});

test("late messages and AI acknowledgements cannot regress a cleared room or completed job", () => {
  const store = createStore();
  store.dispatch(actions.generation(2));
  const message: Message = {
    id: "message-id",
    seq: 1,
    generation: 1,
    author: "TEST #1",
    sessionId: 1,
    text: "Old message",
    kind: "human",
    targetMessageId: null,
    createdAt: new Date().toISOString(),
  };
  store.dispatch(actions.merge([message]));
  assert.equal(store.getState().chat.messages.length, 0);
  store.dispatch(actions.generation(1));
  assert.equal(store.getState().chat.generation, 2);
  store.dispatch(actions.ai({ id: "job", status: "completed", generation: 2 }));
  store.dispatch(actions.ai({ id: "job", status: "running", generation: 2 }));
  assert.equal(store.getState().chat.ai?.status, "completed");
  store.dispatch(actions.draft("A newer draft"));
  store.dispatch(
    actions.clearSentDraft({ ai: false, text: "An older message" }),
  );
  assert.equal(store.getState().chat.draft, "A newer draft");
});

test("a large selected answer remains available within the context budget", () => {
  const context = buildContext(
    [{ author: "Neuron", kind: "ai", text: "selected-answer ".repeat(1500) }],
    "Explain this",
    "ru",
  );
  assert.match(context[1].content, /selected-answer/);
  assert.ok(context[1].content.length < 12100);
});

test("late responses from another session room are ignored", () => {
  const store = createStore();
  store.dispatch(actions.room("room-current"));
  store.dispatch(actions.generation(0));
  store.dispatch(
    actions.merge([
      {
        id: "old",
        seq: 1,
        roomId: "room-other",
        generation: 0,
        author: "Other",
        sessionId: 1,
        text: "Private",
        kind: "human",
        targetMessageId: null,
        createdAt: new Date().toISOString(),
      },
    ]),
  );
  store.dispatch(
    actions.ai({
      id: "old-job",
      status: "running",
      roomId: "room-other",
      generation: 0,
    }),
  );
  assert.equal(store.getState().chat.messages.length, 0);
  assert.equal(store.getState().chat.ai, null);
});
