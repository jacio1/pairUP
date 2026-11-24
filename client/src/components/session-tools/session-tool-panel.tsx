"use client";
import { type SessionTool } from "@/components/session-tools/tools";
import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";
import { useTranslations } from "next-intl";
import { FilesPanel } from "@/components/files/files-panel";
import { NotesPanel } from "./notes-panel";
import { PomodoroPanel } from "./pomodoro-panel";
import { TasksPanel } from "./tasks-panel";
import { WhiteboardPanel } from "./whiteboard-panel";
import { CalculatorPanel } from "./calculator-panel";
import { ToolNeuron } from "./tool-neuron";
import type { ChatActions } from "@/components/chat/use-chat-actions";
export function SessionToolPanel({
  tool,
  roomId,
  chat,
  openChat,
}: {
  tool: Exclude<SessionTool, "chat">;
  roomId: string;
  chat: ChatActions;
  openChat: () => void;
}) {
  const t = useTranslations("Room");
  return (
    <section
      className="flex h-full min-h-0 flex-col bg-background"
      aria-label={t(tool)}
    >
      <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
        <h2 className="text-sm font-semibold">{t(tool)}</h2>
        {tool !== "calculator" && <Badge variant="secondary" className="gap-1 text-[10px]">
          <Users className="size-3" />
          {t("sharedAccess")}
        </Badge>}
      </div>
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain p-4 sm:p-5">
        {tool === "notes" && <NotesPanel roomId={roomId} neuron={(id) => (
          <ToolNeuron key={id ?? "new-note"} tool="notes" chat={chat} noteId={id} openChat={openChat} />
        )} />}
        {(tool === "tasks" || tool === "pomodoro") && <ToolNeuron tool={tool} chat={chat} openChat={openChat} />}
        {tool === "calculator" && <CalculatorPanel />}
        {tool === "tasks" && <TasksPanel key={roomId} roomId={roomId} />}
        {tool === "pomodoro" && <PomodoroPanel key={roomId} roomId={roomId} />}
        {tool === "whiteboard" && (
          <WhiteboardPanel key={roomId} roomId={roomId} />
        )}
        {tool === "files" && <FilesPanel key={roomId} roomId={roomId} />}
      </div>
    </section>
  );
}
