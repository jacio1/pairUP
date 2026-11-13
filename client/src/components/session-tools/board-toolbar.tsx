"use client";
import {
  MousePointer2,
  Pencil,
  ArrowUpRight,
  Square,
  Circle,
  Type,
  Trash2,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import type { BoardTool } from "./board-canvas";
export function BoardToolbar({
  tool,
  setTool,
  color,
  setColor,
  width,
  setWidth,
  disabled,
  selected,
  remove,
}: {
  tool: BoardTool;
  setTool: (t: BoardTool) => void;
  color: string;
  setColor: (c: string) => void;
  width: number;
  setWidth: (w: number) => void;
  disabled: boolean;
  selected: boolean;
  remove: () => void;
}) {
  const t = useTranslations("Activities");
  return (
    <div className="space-y-3 rounded-xl border bg-card p-3">
      <div
        className="flex flex-wrap gap-1"
        role="group"
        aria-label={t("drawingTools")}
      >
        {(
          [
            ["pointer", MousePointer2],
            ["pencil", Pencil],
            ["line", ArrowUpRight],
            ["square", Square],
            ["circle", Circle],
            ["text", Type],
          ] as const
        ).map(([key, Icon]) => (
          <Button
            key={key}
            size="icon-sm"
            variant={tool === key ? "secondary" : "ghost"}
            aria-label={t(key)}
            title={t(key)}
            aria-pressed={tool === key}
            disabled={disabled}
            onClick={() => setTool(key)}
          >
            <Icon className="size-4" />
          </Button>
        ))}
        <Button
          size="icon-sm"
          variant="ghost"
          className="ml-auto"
          aria-label={t("removeSelected")}
          disabled={disabled || !selected}
          onClick={remove}
        >
          <Trash2 className="size-4" />
        </Button>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1.5" role="group" aria-label={t("colors")}>
          {[
            "#1f2937",
            "#7c3aed",
            "#2563eb",
            "#059669",
            "#e11d48",
            "#d97706",
          ].map((c) => (
            <button
              key={c}
              type="button"
              disabled={disabled}
              aria-label={t("color", { value: c })}
              aria-pressed={c === color}
              onClick={() => setColor(c)}
              className={`size-6 rounded-full border-2 outline-none ring-offset-2 ring-offset-card focus-visible:ring-2 focus-visible:ring-ring ${color === c ? "ring-2 ring-primary" : "border-transparent"}`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
        <select
          aria-label={t("strokeWidth")}
          value={width}
          disabled={disabled}
          onChange={(e) => setWidth(Number(e.target.value))}
          className="rounded-md border bg-background px-2 py-1 text-xs"
        >
          {[2, 4, 8].map((w) => (
            <option key={w} value={w}>
              {t(w === 2 ? "thin" : w === 4 ? "medium" : "thick")}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
