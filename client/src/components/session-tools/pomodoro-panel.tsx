"use client";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Pause, Play, RotateCcw, SkipForward } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  useRoomTimerQuery,
  useChangeTimerMutation,
  type TimerChange,
} from "@/lib/room-activities-api";
import { useAppSelector } from "@/lib/hooks";
import { studyError } from "@/lib/study-tools-api";
import { ToolFeedback } from "./tool-feedback";
import { TimerSettings } from "./timer-settings";
export function PomodoroPanel({ roomId }: { roomId: string }) {
  const t = useTranslations("Activities");
  const connected = useAppSelector((s) => s.chat.connected);
  const {
    data,
    error: loadError,
    refetch,
  } = useRoomTimerQuery(roomId, {
    pollingInterval: 10000,
    refetchOnMountOrArgChange: true,
  });
  const [mutate, { isLoading }] = useChangeTimerMutation();
  const [error, setError] = useState(""),
    [now, setNow] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setNow(performance.now()), 250);
    return () => clearInterval(id);
  }, []);
  async function change(input: TimerChange) {
    if (!data || isLoading || !connected) return false;
    setError("");
    try {
      await mutate({ roomId, version: data.version, ...input }).unwrap();
      await refetch().unwrap();
      return true;
    } catch (e) {
      setError(studyError(e));
      void refetch();
      return false;
    }
  }
  if (!data)
    return loadError ? (
      <ToolFeedback
        error={studyError(loadError)}
        retry={() => void refetch()}
      />
    ) : (
      <p role="status" className="text-sm text-muted-foreground">
        {t("loading")}
      </p>
    );
  const elapsed = Math.max(0, now - data.receivedAt);
  const remaining = data.endsAt
    ? Math.max(0, new Date(data.endsAt).getTime() - data.serverNow - elapsed)
    : data.remainingMs;
  const seconds = Math.ceil(remaining / 1000),
    running = !!data.endsAt && remaining > 0;
  const duration =
    (data.mode === "focus"
      ? data.focusSeconds
      : data.mode === "break"
        ? data.breakSeconds
        : data.longBreakSeconds) * 1000;
  const disabled = isLoading || !connected;
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-center gap-1">
        {(["focus", "break", "longBreak"] as const).map((mode) => (
          <Button
            key={mode}
            size="sm"
            variant={data.mode === mode ? "secondary" : "ghost"}
            aria-pressed={data.mode === mode}
            disabled={disabled}
            onClick={() => void change({ action: "mode", mode })}
          >
            {t(mode)}
          </Button>
        ))}
      </div>
      <div className="relative mx-auto flex size-60 items-center justify-center">
        <svg
          className="absolute inset-0 -rotate-90"
          viewBox="0 0 240 240"
          aria-hidden="true"
        >
          <circle
            cx="120"
            cy="120"
            r="108"
            fill="none"
            stroke="currentColor"
            strokeWidth="6"
            className="text-muted"
          />
          <circle
            cx="120"
            cy="120"
            r="108"
            fill="none"
            stroke="currentColor"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray="679"
            strokeDashoffset={679 * (1 - remaining / duration)}
            className="text-primary"
          />
        </svg>
        <div className="text-center">
          <p
            role="timer"
            aria-label={t("remaining")}
            className="text-5xl font-light tracking-tight tabular-nums"
          >
            {String(Math.floor(seconds / 60)).padStart(2, "0")}:
            {String(seconds % 60).padStart(2, "0")}
          </p>
          <p className="mt-3 text-xs text-muted-foreground">
            {t("round", { count: data.completed + 1 })}
          </p>
        </div>
      </div>
      <p role="status" className="text-center text-sm text-muted-foreground">
        {!connected
          ? t("offline")
          : remaining === 0
            ? t("finished")
            : running
              ? t("running")
              : t("paused")}
      </p>
      <div className="flex justify-center gap-3">
        <Button
          size="icon"
          variant="outline"
          disabled={disabled}
          aria-label={t("reset")}
          onClick={() => void change({ action: "reset" })}
        >
          <RotateCcw className="size-4" />
        </Button>
        <Button
          className="min-w-32"
          disabled={disabled}
          onClick={() => void change({ action: running ? "pause" : "start" })}
        >
          {running ? <Pause className="size-4" /> : <Play className="size-4" />}
          {t(running ? "pause" : "start")}
        </Button>
        <Button
          size="icon"
          variant="outline"
          disabled={disabled}
          aria-label={t("next")}
          onClick={() => void change({ action: "next" })}
        >
          <SkipForward className="size-4" />
        </Button>
      </div>
      <ToolFeedback error={error} retry={() => void refetch()} />
      <TimerSettings
        key={`${data.focusSeconds}-${data.breakSeconds}-${data.longBreakSeconds}`}
        timer={data}
        disabled={disabled}
        change={change}
      />
    </div>
  );
}
