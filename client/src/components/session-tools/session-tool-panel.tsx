"use client";
import { type SessionTool } from "@/components/session-tools/tools";
import { Badge } from "@/components/ui/badge";
import { LockKeyhole } from "lucide-react";
import { useTranslations } from "next-intl";
import { FilesPreview } from "./files-preview";
import { NotesPreview } from "./notes-preview";
import { PomodoroPreview } from "./pomodoro-preview";
import { TasksPreview } from "./tasks-preview";
import { WhiteboardPreview } from "./whiteboard-preview";
export function SessionToolPanel({
  tool,
}: {
  tool: Exclude<SessionTool, "chat">;
}) {
  const t = useTranslations("Room");
  return (
    <section
      className="flex h-full min-h-0 flex-col bg-muted/20"
      aria-label={t(tool)}
    >
      <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
        <h2 className="text-sm font-semibold">{t(tool)}</h2>
        <Badge
          variant="outline"
          className="gap-1 text-[10px] text-muted-foreground"
        >
          <LockKeyhole className="size-3" />
          {t("preview")}
        </Badge>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-5">
        {tool === "notes" && <NotesPreview />}
        {tool === "tasks" && <TasksPreview />}
        {tool === "pomodoro" && <PomodoroPreview />}
        {tool === "whiteboard" && <WhiteboardPreview />}
        {tool === "files" && <FilesPreview />}
        <p className="mt-6 text-center text-[10px] leading-5 text-muted-foreground">
          {t("previewHint")}
        </p>
      </div>
    </section>
  );
}
