"use client";
import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Download, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useBoardActions } from "./use-board-actions";
import { BoardToolbar } from "./board-toolbar";
import { BoardCanvas, type BoardTool } from "./board-canvas";
import { ToolFeedback } from "./tool-feedback";
import { BoardViewport } from "./board-viewport";
export function WhiteboardPanel({ roomId }: { roomId: string }) {
  const t = useTranslations("Activities"),
    board = useBoardActions(roomId),
    container = useRef<HTMLDivElement>(null);
  const [tool, setTool] = useState<BoardTool>("pencil"),
    [color, setColor] = useState("#7c3aed"),
    [width, setWidth] = useState(4),
    [selected, setSelected] = useState<string | null>(null),
    [clear, setClear] = useState(false);
  const disabled = !board.data || !board.connected || board.busy;
  function exportBoard() {
    const svg = container.current?.querySelector<SVGSVGElement>(
      "[data-board-canvas]",
    );
    if (!svg) return;
    const clone = svg.cloneNode(true) as SVGSVGElement;
    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    clone.setAttribute("width", "1000");
    clone.setAttribute("height", "700");
    clone.removeAttribute("class");
    clone
      .querySelectorAll("[style]")
      .forEach((el) => el.removeAttribute("style"));
    const url = URL.createObjectURL(
      new Blob([new XMLSerializer().serializeToString(clone)], {
        type: "image/svg+xml",
      }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "PairUp-whiteboard.svg";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  function remove() {
    if (selected) void board.command("remove", selected);
    setSelected(null);
  }
  return (
    <BoardViewport>
      {({ expanded, zoom }) => (
        <div
          className={
            expanded ? "flex min-h-0 flex-1 flex-col gap-3" : "space-y-4"
          }
          ref={container}
        >
          <BoardToolbar
            tool={tool}
            setTool={setTool}
            color={color}
            setColor={setColor}
            width={width}
            setWidth={setWidth}
            disabled={disabled}
            selected={!!selected && !board.pending}
            remove={remove}
          />
          {!board.data && !board.error && (
            <p role="status" className="text-sm text-muted-foreground">
              {t("loading")}
            </p>
          )}
          <div
            className={
              expanded
                ? "min-h-0 flex-1 overflow-auto overscroll-contain rounded-xl bg-muted/40"
                : ""
            }
          >
            <div style={{ width: `${zoom * 100}%` }}>
              <BoardCanvas
                elements={board.elements}
                tool={tool}
                color={color}
                width={width}
                disabled={disabled}
                selected={selected}
                select={setSelected}
                add={board.add}
                remove={remove}
              />
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Button
              variant="ghost"
              size="sm"
              disabled={disabled || !!board.pending || !board.elements.length}
              onClick={() => setClear(true)}
            >
              <Trash2 className="size-4" />
              {t("clearBoard")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!board.data || !!board.pending}
              onClick={exportBoard}
            >
              <Download className="size-4" />
              {t("exportBoard")}
            </Button>
          </div>
          <p role="status" className="text-xs leading-5 text-muted-foreground">
            {!board.connected
              ? t("offline")
              : board.pending
                ? t("saving")
                : t(expanded ? "panHint" : "boardHint")}
          </p>
          <ToolFeedback error={board.error} retry={board.retry} />
          {board.error && !!board.pending && (
            <Button variant="ghost" size="sm" onClick={board.discard}>
              {t("discard")}
            </Button>
          )}
          <AlertDialog
            open={clear}
            onOpenChange={(open) => {
              if (!board.busy) setClear(open);
            }}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t("clearBoard")}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t("clearConfirm")}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <ToolFeedback error={board.error} />
              <AlertDialogFooter>
                <AlertDialogCancel disabled={board.busy}>
                  {t("cancel")}
                </AlertDialogCancel>
                <AlertDialogAction
                  variant="destructive"
                  disabled={disabled || !!board.pending}
                  onClick={async () => {
                    if (await board.command("clear")) setClear(false);
                  }}
                >
                  {t("clearBoard")}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}
    </BoardViewport>
  );
}
