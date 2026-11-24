import { Calculator, ListChecks, Paperclip, Pencil, StickyNote, Timer } from "lucide-react";
export const sessionTools = [
  { key: "notes", icon: StickyNote },
  { key: "tasks", icon: ListChecks },
  { key: "pomodoro", icon: Timer },
  { key: "whiteboard", icon: Pencil },
  { key: "files", icon: Paperclip },
  { key: "calculator", icon: Calculator },
] as const;
export type SessionTool = "chat" | (typeof sessionTools)[number]["key"];
