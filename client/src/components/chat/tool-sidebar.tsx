"use client";
import { SessionToolPanel } from "@/components/session-tools/session-tool-panel";
import { type SessionTool } from "@/components/session-tools/tools";
import { Button } from "@/components/ui/button";
import { PanelRightClose } from "lucide-react";
import { useTranslations } from "next-intl";
export function ToolSidebar({
  activeTool,
  onClose,
}: {
  activeTool: Exclude<SessionTool, "chat">;
  onClose: () => void;
}) {
  const room = useTranslations("Room");
  return (
    <aside
      className="flex min-h-0 w-full shrink-0 flex-col border-border bg-background lg:w-[390px] lg:border-l xl:w-[440px]"
      aria-label={room("tools")}
    >
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
        <SessionToolPanel tool={activeTool} />
      </div>
    </aside>
  );
}
