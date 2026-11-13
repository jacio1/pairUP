import { test } from "node:test";
import assert from "node:assert/strict";
import type { RoomTimer } from "@prisma/client";
import { changeTimer } from "../src/room-timer";
import { boardElement } from "../src/board-element";
const initial: RoomTimer = {
  roomId: "test",
  mode: "focus",
  focusSeconds: 1500,
  breakSeconds: 300,
  longBreakSeconds: 900,
  remainingMs: 1500000,
  endsAt: null,
  completed: 0,
  version: 0,
};
test("timer uses server deadlines, preserves pause/resume and detects conflicting commands", () => {
  const started = changeTimer(initial, { version: 0, action: "start" }, 10000);
  assert.equal(started.endsAt?.getTime(), 1510000);
  const paused = changeTimer(started, { version: 1, action: "pause" }, 13000);
  assert.equal(paused.remainingMs, 1497000);
  assert.equal(paused.endsAt, null);
  const resumed = changeTimer(paused, { version: 2, action: "start" }, 20000);
  assert.equal(resumed.endsAt?.getTime(), 1517000);
  const expired = changeTimer(
    resumed,
    { version: 3, action: "pause" },
    2000000,
  );
  assert.equal(expired.remainingMs, 0);
  assert.throws(() =>
    changeTimer(expired, { version: 0, action: "reset" }, 2000000),
  );
  assert.equal(
    changeTimer(expired, { version: 4, action: "reset" }, 2000000).remainingMs,
    1500000,
  );
});
test("timer cycles to long breaks every fourth focus and validates interval settings", () => {
  const next = changeTimer(
    { ...initial, completed: 3 },
    { version: 0, action: "next" },
    0,
  );
  assert.equal(next.mode, "longBreak");
  assert.equal(next.remainingMs, 900000);
  assert.equal(
    changeTimer(next, { version: 1, action: "next" }, 0).mode,
    "focus",
  );
  for (const seconds of [0, 59, 7201, NaN, 60.5])
    assert.throws(() =>
      changeTimer(
        initial,
        {
          version: 0,
          action: "configure",
          focusSeconds: seconds,
          breakSeconds: 300,
          longBreakSeconds: 900,
        },
        0,
      ),
    );
  const configured = changeTimer(
    initial,
    {
      version: 0,
      action: "configure",
      focusSeconds: 60,
      breakSeconds: 120,
      longBreakSeconds: 180,
    },
    0,
  );
  assert.equal(configured.remainingMs, 60000);
  assert.equal(configured.endsAt, null);
});
test("board elements whitelist fields and reject oversized or executable payloads", () => {
  const shape = {
    id: crypto.randomUUID(),
    kind: "line",
    color: "#2563eb",
    width: 4,
    points: [
      [0, 0],
      [1000, 700],
    ],
  };
  assert.deepEqual(boardElement({ ...shape, owner: "forged" }), shape);
  for (const input of [
    { ...shape, color: "url(javascript:alert(1))" },
    {
      ...shape,
      points: [
        [NaN, 2],
        [3, 4],
      ],
    },
    { ...shape, points: [[2, 3]] },
    { ...shape, kind: "pencil", points: Array(251).fill([0, 0]) },
    { ...shape, kind: "text", points: [[0, 0]], text: "x".repeat(201) },
  ])
    assert.throws(() => boardElement(input));
  assert.equal(
    boardElement({
      ...shape,
      kind: "text",
      points: [[0, 0]],
      text: " <script> ",
    }).text,
    "<script>",
  );
});
