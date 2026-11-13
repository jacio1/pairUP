"use client";
import { useRef, useState, type PointerEvent } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import type { BoardElement } from "@/lib/room-activities-api";
import { BoardShape } from "./board-shape";
export type BoardTool = BoardElement["kind"] | "pointer";
export function BoardCanvas({
  elements,
  tool,
  color,
  width,
  disabled,
  selected,
  select,
  add,
  remove,
}: {
  elements: BoardElement[];
  tool: BoardTool;
  color: string;
  width: number;
  disabled: boolean;
  selected: string | null;
  select: (id: string | null) => void;
  add: (element: BoardElement) => void;
  remove: () => void;
}) {
  const t = useTranslations("Activities"),
    draftRef = useRef<BoardElement | null>(null),
    pointer = useRef<number | null>(null);
  const [draft, setDraft] = useState<BoardElement | null>(null),
    [position, setPosition] = useState<number[] | null>(null),
    [text, setText] = useState("");
  function point(e: PointerEvent<SVGSVGElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    return [
      Math.round(
        Math.max(0, Math.min(1000, ((e.clientX - r.left) / r.width) * 1000)),
      ),
      Math.round(
        Math.max(0, Math.min(700, ((e.clientY - r.top) / r.height) * 700)),
      ),
    ];
  }
  function start(e: PointerEvent<SVGSVGElement>) {
    if (disabled || pointer.current !== null || e.button !== 0) return;
    if (tool === "pointer") {
      select(
        (e.target as Element)
          .closest("[data-element-id]")
          ?.getAttribute("data-element-id") || null,
      );
      return;
    }
    const p = point(e);
    if (tool === "text") {
      setPosition(p);
      setText("");
      return;
    }
    pointer.current = e.pointerId;
    e.currentTarget.setPointerCapture(e.pointerId);
    draftRef.current = {
      id: crypto.randomUUID(),
      kind: tool,
      color,
      width,
      points: tool === "pencil" ? [p] : [p, p],
    };
    setDraft(draftRef.current);
  }
  function move(e: PointerEvent<SVGSVGElement>) {
    const current = draftRef.current;
    if (!current || pointer.current !== e.pointerId) return;
    const p = point(e),
      last = current.points.at(-1)!;
    if (Math.hypot(p[0] - last[0], p[1] - last[1]) < 2) return;
    const points =
      current.kind === "pencil"
        ? [...current.points, p]
        : [current.points[0], p];
    // Bound every stroke while preserving its start and most recent points.
    draftRef.current = {
      ...current,
      points:
        points.length > 250
          ? points.filter((_, i) => i % 2 === 0 || i === points.length - 1)
          : points,
    };
    setDraft(draftRef.current);
  }
  function end(e: PointerEvent<SVGSVGElement>, cancel = false) {
    if (pointer.current !== e.pointerId) return;
    move(e);
    const current = draftRef.current;
    draftRef.current = null;
    pointer.current = null;
    setDraft(null);
    if (!cancel && current && !disabled) add(current);
  }
  return (
    <>
      <svg
        data-board-canvas
        viewBox="0 0 1000 700"
        role="img"
        aria-label={t("canvas")}
        tabIndex={0}
        onPointerDown={start}
        onPointerMove={move}
        onPointerUp={(e) => end(e)}
        onPointerCancel={(e) => end(e, true)}
        onLostPointerCapture={(e) => end(e, true)}
        onKeyDown={(e) => {
          if (
            !disabled &&
            selected &&
            (e.key === "Delete" || e.key === "Backspace")
          ) {
            e.preventDefault();
            remove();
          }
        }}
        className={`block aspect-[10/7] w-full touch-none rounded-xl border bg-white outline-none focus-visible:ring-2 focus-visible:ring-ring ${disabled ? "cursor-not-allowed" : tool === "pointer" ? "cursor-default" : "cursor-crosshair"}`}
      >
        <rect width="1000" height="700" fill="white" />
        {elements.map((element) => (
          <BoardShape
            key={element.id}
            element={element}
            selected={selected === element.id}
          />
        ))}
        {draft && <BoardShape element={draft} />}
      </svg>
      <Dialog
        open={!!position}
        onOpenChange={(open) => {
          if (!open) setPosition(null);
        }}
      >
        <DialogContent>
          <DialogTitle>{t("addText")}</DialogTitle>
          <DialogDescription>{t("textHint")}</DialogDescription>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (position && text.trim() && !disabled) {
                add({
                  id: crypto.randomUUID(),
                  kind: "text",
                  color,
                  width,
                  points: [position],
                  text: text.trim(),
                });
                setPosition(null);
              }
            }}
          >
            <Input
              autoFocus
              aria-label={t("text")}
              value={text}
              maxLength={200}
              onChange={(e) => setText(e.target.value)}
            />
            <Button type="submit" disabled={!text.trim() || disabled}>
              {t("addText")}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
