import type { BoardElement } from "./room-activities-api";
export const STROKE_POINT_LIMIT = 250;
export function extendStroke(
  current: BoardElement,
  point: number[],
  nextId: () => string,
): { draft: BoardElement; completed?: BoardElement } {
  const last = current.points.at(-1)!;
  if (Math.hypot(point[0] - last[0], point[1] - last[1]) < 0.5)
    return { draft: current };
  if (current.kind !== "pencil")
    return { draft: { ...current, points: [current.points[0], point] } };
  if (current.points.length < STROKE_POINT_LIMIT)
    return { draft: { ...current, points: [...current.points, point] } };
  return {
    completed: current,
    draft: {
      ...current,
      id: nextId(),
      strokeId: current.strokeId || current.id,
      points: [last, point],
    },
  };
}
