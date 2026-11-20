import { fail as toolError } from "../common/api-error";
import { validId } from "../core";
export type BoardElement = {
  strokeId?: string;
  id: string;
  kind: "pencil" | "line" | "square" | "circle" | "text";
  color: string;
  width: number;
  points: number[][];
  text?: string;
};
export function boardElement(raw: unknown): BoardElement {
  const e = raw as BoardElement;
  if (
    !e ||
    !validId(e.id) ||
    (e.strokeId !== undefined &&
      (e.kind !== "pencil" || !validId(e.strokeId))) ||
    !["pencil", "line", "square", "circle", "text"].includes(e.kind) ||
    !/^#[0-9a-f]{6}$/i.test(e.color) ||
    ![2, 4, 8].includes(e.width) ||
    !Array.isArray(e.points) ||
    e.points.length < 1 ||
    e.points.length > 250
  )
    return toolError("INVALID_INPUT");
  if (
    e.points.some(
      (p) =>
        !Array.isArray(p) ||
        p.length !== 2 ||
        p.some(
          (n) =>
            typeof n !== "number" || !Number.isFinite(n) || n < 0 || n > 1000,
        ),
    )
  )
    return toolError("INVALID_INPUT");
  if (e.kind !== "pencil" && e.kind !== "text" && e.points.length !== 2)
    return toolError("INVALID_INPUT");
  if (
    e.kind === "text" &&
    (typeof e.text !== "string" ||
      !e.text.trim() ||
      e.text.length > 200 ||
      e.points.length !== 1)
  )
    return toolError("INVALID_INPUT");
  return {
    id: e.id,
    kind: e.kind,
    color: e.color,
    width: e.width,
    points: e.points.map((p) => [...p]),
    ...(e.strokeId ? { strokeId: e.strokeId } : {}),
    ...(e.kind === "text" ? { text: e.text!.trim() } : {}),
  };
}

export function removeBoardElement(elements: BoardElement[], id: string) {
  const selected = elements.find((e) => e.id === id);
  return elements.filter(
    (e) =>
      e.id !== id && (!selected?.strokeId || e.strokeId !== selected.strokeId),
  );
}
