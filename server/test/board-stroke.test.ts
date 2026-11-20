import { test } from "node:test";
import assert from "node:assert/strict";
import { extendStroke } from "../../client/src/lib/board-stroke";
import type { BoardElement } from "../../client/src/lib/room-activities-api";
import {
  boardElement,
  removeBoardElement,
} from "../src/study-tools/board-element";
test("long strokes keep all sampled geometry and continuous segment boundaries", () => {
  const points = Array.from({ length: 5000 }, (_, i) => [
    500 + 200 * Math.sin(i * 0.012),
    350 + 100 * Math.cos(i * 0.012),
  ]);
  const id = crypto.randomUUID();
  let draft: BoardElement = {
    id,
    strokeId: id,
    kind: "pencil",
    color: "#7c3aed",
    width: 4,
    points: [points[0]],
  };
  const segments: BoardElement[] = [];
  for (const point of points.slice(1)) {
    const next = extendStroke(draft, point, () => crypto.randomUUID());
    if (next.completed) segments.push(next.completed);
    draft = next.draft;
  }
  segments.push(draft);
  assert.ok(segments.length > 1);
  assert.deepEqual(
    segments.flatMap((s, i) => (i ? s.points.slice(1) : s.points)),
    points,
  );
  for (const [i, segment] of segments.entries()) {
    assert.ok(segment.points.length <= 250);
    assert.equal(segment.strokeId, id);
    assert.deepEqual(boardElement(segment), segment);
    if (i) assert.deepEqual(segment.points[0], segments[i - 1].points.at(-1));
  }
});
test("deleting a segmented pencil stroke removes its whole group and keeps other drawings", () => {
  const group = crypto.randomUUID();
  const shape = (id: string, strokeId?: string): BoardElement => ({
    id,
    strokeId,
    kind: "pencil",
    color: "#2563eb",
    width: 4,
    points: [
      [1, 2],
      [4, 5],
    ],
  });
  const a = shape(crypto.randomUUID(), group),
    b = shape(crypto.randomUUID(), group),
    other = shape(crypto.randomUUID()),
    all = [a, b, other];
  assert.deepEqual(removeBoardElement(all, b.id), [other]);
  assert.deepEqual(removeBoardElement(all, other.id), [a, b]);
  assert.throws(() => boardElement({ ...a, strokeId: "invalid" }));
});
