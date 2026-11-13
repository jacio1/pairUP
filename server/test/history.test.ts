import { test } from "node:test";
import assert from "node:assert/strict";
import { historyWindow, HISTORY_PAGE_SIZE } from "../src/history";
import { actions, createStore } from "../../client/src/lib/store";
test("history cursors distinguish latest, older and forward catch-up", () => {
  assert.equal(HISTORY_PAGE_SIZE, 50);
  assert.equal(historyWindow().mode, "latest");
  assert.deepEqual(historyWindow(0), {
    mode: "after",
    where: { gt: 0 },
    order: "asc",
  });
  assert.deepEqual(historyWindow(undefined, 42), {
    mode: "older",
    where: { lt: 42 },
    order: "desc",
  });
  for (const value of [-1, NaN, Infinity, 0.5, Number.MAX_SAFE_INTEGER + 1])
    assert.throws(() => historyWindow(value));
  assert.throws(() => historyWindow(1, 2));
});
test("history metadata and references cannot leak between rooms or generations", () => {
  const store = createStore();
  store.dispatch(actions.room("one"));
  store.dispatch(actions.generation(1));
  store.dispatch(
    actions.history({ roomId: "one", generation: 1, hasOlder: true }),
  );
  assert.equal(store.getState().chat.historyReady, true);
  store.dispatch(
    actions.references({
      roomId: "one",
      generation: 1,
      items: [{ id: "quote", text: "original" }],
    }),
  );
  store.dispatch(actions.room("two"));
  store.dispatch(actions.generation(2));
  store.dispatch(
    actions.history({ roomId: "one", generation: 1, hasOlder: true }),
  );
  store.dispatch(
    actions.references({
      roomId: "one",
      generation: 1,
      items: [{ id: "quote", text: "stale" }],
    }),
  );
  assert.equal(store.getState().chat.historyReady, false);
  assert.deepEqual(store.getState().chat.references, {});
  store.dispatch(actions.generation(3));
  store.dispatch(
    actions.history({ roomId: "two", generation: 2, hasOlder: true }),
  );
  assert.equal(store.getState().chat.historyReady, false);
});
