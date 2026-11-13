import type { RoomTimer } from "@prisma/client";
import { toolError, versionInput } from "./study-note";
export type TimerInput = {
  version: number;
  action: "start" | "pause" | "reset" | "next" | "configure" | "mode";
  mode?: string;
  focusSeconds?: number;
  breakSeconds?: number;
  longBreakSeconds?: number;
};
export const timerDuration = (t: RoomTimer) =>
  1000 *
  (t.mode === "focus"
    ? t.focusSeconds
    : t.mode === "break"
      ? t.breakSeconds
      : t.longBreakSeconds);
export function changeTimer(t: RoomTimer, input: TimerInput, now: number) {
  versionInput(input?.version);
  if (input.version !== t.version) return toolError("TOOL_CONFLICT", 409);
  const next = { ...t };
  next.remainingMs = t.endsAt
    ? Math.max(0, t.endsAt.getTime() - now)
    : t.remainingMs;
  switch (input.action) {
    case "start":
      if (next.remainingMs === 0) next.remainingMs = timerDuration(t);
      next.endsAt = new Date(now + next.remainingMs);
      break;
    case "pause":
      next.endsAt = null;
      break;
    case "reset":
      next.endsAt = null;
      next.remainingMs = timerDuration(t);
      break;
    case "next":
      next.endsAt = null;
      if (t.mode === "focus") {
        next.completed++;
        next.mode = next.completed % 4 === 0 ? "longBreak" : "break";
      } else next.mode = "focus";
      next.remainingMs = timerDuration(next);
      break;
    case "mode":
      if (!["focus", "break", "longBreak"].includes(input.mode || ""))
        return toolError("INVALID_INPUT");
      next.mode = input.mode!;
      next.endsAt = null;
      next.remainingMs = timerDuration(next);
      break;
    case "configure":
      for (const key of [
        "focusSeconds",
        "breakSeconds",
        "longBreakSeconds",
      ] as const) {
        const value = input[key];
        if (!Number.isInteger(value) || value! < 60 || value! > 7200)
          return toolError("INVALID_INPUT");
        next[key] = value!;
      }
      next.endsAt = null;
      next.remainingMs = timerDuration(next);
      break;
    default:
      return toolError("INVALID_INPUT");
  }
  // Expired clocks are represented by the same persisted deadline until a participant acts.
  return { ...next, version: t.version + 1 };
}
