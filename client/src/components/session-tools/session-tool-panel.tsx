"use client";
import { type SessionTool } from "@/components/session-tools/tools";
import { Badge } from "@/components/ui/badge";
import { LockKeyhole, Users } from "lucide-react";
import { useTranslations } from "next-intl";
import { FilesPanel } from "@/components/files/files-panel";
import { NotesPanel } from "./notes-panel";
import { PomodoroPreview } from "./pomodoro-preview";
import { TasksPanel } from "./tasks-panel";
import { WhiteboardPreview } from "./whiteboard-preview";
export function SessionToolPanel({
  tool,
  roomId,
}: {
  tool: Exclude<SessionTool, "chat">;
  roomId: string;
}) {
  const t = useTranslations("Room");
  const live = tool === "notes" || tool === "tasks" || tool === "files";
  return (
    <section
      className="flex h-full min-h-0 flex-col bg-background"
      aria-label={t(tool)}
    >
      <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
        <h2 className="text-sm font-semibold">{t(tool)}</h2>
        {live ? (
          <Badge variant="secondary" className="gap-1 text-[10px]">
            <Users className="size-3" />
            {t("sharedAccess")}
          </Badge>
        ) : (
          <Badge
            variant="outline"
            className="gap-1 text-[10px] text-muted-foreground"
          >
            <LockKeyhole className="size-3" />
            {t("preview")}
          </Badge>
        )}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-5">
        {tool === "notes" && <NotesPanel key={roomId} roomId={roomId} />}
        {tool === "tasks" && <TasksPanel key={roomId} roomId={roomId} />}
        {tool === "pomodoro" && <PomodoroPreview />}
        {tool === "whiteboard" && <WhiteboardPreview />}
        {tool === "files" && <FilesPanel key={roomId} roomId={roomId} />}
        {!live && (
          <p className="mt-6 text-center text-[10px] leading-5 text-muted-foreground">
            {t("previewHint")}
          </p>
        )}
      </div>
    </section>
  );
}
