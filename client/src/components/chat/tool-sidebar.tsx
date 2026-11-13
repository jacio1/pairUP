"use client";
import { SessionToolPanel } from "@/components/session-tools/session-tool-panel";
import { type SessionTool } from "@/components/session-tools/tools";
import { Button } from "@/components/ui/button";
import { PanelRightClose } from "lucide-react";
import { useTranslations } from "next-intl";
import { useToolResize } from "./use-tool-resize";
import type { CSSProperties } from "react";
export function ToolSidebar({
  activeTool,
  roomId,
  onClose,
}: {
  activeTool: Exclude<SessionTool, "chat">;
  roomId: string;
  onClose: () => void;
}) {
  const room = useTranslations("Room");
  const t = useTranslations("Files"),
    { sidebar, width, max, handle } = useToolResize();
  return (
    <aside
      ref={sidebar}
      style={{ "--tools-width": `${width}px` } as CSSProperties}
      className="tool-sidebar relative flex min-h-0 shrink-0 flex-col border-border bg-background max-lg:w-full lg:border-l"
      aria-label={room("tools")}
    >
      <div
        {...handle}
        role="separator"
        aria-orientation="vertical"
        aria-label={t("resize")}
        aria-valuemin={320}
        aria-valuemax={Math.round(max)}
        aria-valuenow={width}
        tabIndex={0}
        title={t("resizeHint")}
        className="absolute inset-y-0 -left-1 z-30 hidden w-2 touch-none cursor-col-resize items-center justify-center outline-none hover:bg-primary/15 focus-visible:bg-primary/20 focus-visible:ring-2 focus-visible:ring-ring lg:flex"
      >
        <span className="h-10 w-1 rounded-full bg-border" />
      </div>
      <div className="hidden items-center justify-between border-b border-border px-5 py-2 lg:flex">
        <span className="text-[10px] font-medium tracking-wide text-muted-foreground">
          {room("tools")}
        </span>
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={onClose}
          aria-label={room("closeTools")}
        >
          <PanelRightClose className="size-3.5" />
        </Button>
      </div>
      <div className="min-h-0 flex-1">
        <SessionToolPanel tool={activeTool} roomId={roomId} />
      </div>
    </aside>
  );
}
