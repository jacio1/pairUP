"use client";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";
import { NeuronMascot } from "@/components/neuron-mascot";
import { useTranslations } from "next-intl";
import { useMessageHistory } from "./use-message-history";
import { useAppSelector } from "@/lib/hooks";
import { useMemo } from "react";
import { MessageItem } from "./message-item";
import type { ChatActions } from "./use-chat-actions";
export function MessageList({
  chat,
}: {
  chat: Pick<
    ChatActions,
    | "session"
    | "messages"
    | "busy"
    | "ai"
    | "presenter"
    | "retryAi"
    | "mode"
    | "listing"
  >;
}) {
  const t = useTranslations("Demo");
  const errors = useTranslations("Errors");
  const { session, messages, busy, ai, presenter, retryAi, mode, listing } =
    chat;
  const { viewport, onScroll, older, loading, error, hasOlder, historyReady } =
    useMessageHistory();
  const extra = useTranslations("ChatExtras");
  const references = useAppSelector((s) => s.chat.references);
  const byId = useMemo(
    () => new Map(messages.map((m) => [m.id, m])),
    [messages],
  );
  return (
    <div
      ref={viewport}
      onScroll={onScroll}
      className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-6 sm:px-7"
      role="log"
      aria-label={t("messages")}
      aria-live="polite"
    >
      <div className="mx-auto max-w-3xl space-y-4">
        {hasOlder && (
          <div className="text-center">
            <Button
              variant="ghost"
              size="sm"
              disabled={loading}
              onClick={() => void older()}
            >
              {extra(loading ? "loading" : error ? "retry" : "older")}
            </Button>
          </div>
        )}
        {historyReady && !hasOlder && (
          <div className="mx-auto mb-8 max-w-sm rounded-2xl border border-border/60 bg-card/80 px-5 py-4 text-center">
            <NeuronMascot className="mx-auto mb-2 size-20" />
            <h2 className="text-xs font-semibold">
              {listing?.title || "PairUp"}
            </h2>
            <p className="mt-1.5 text-xs leading-5 text-muted-foreground">
              {t("roomWelcomeText")}
            </p>
          </div>
        )}
        {messages.map((message) => (
          <MessageItem
            key={message.id}
            message={message}
            parent={
              byId.get(message.targetMessageId || "") ||
              references[message.targetMessageId || ""]
            }
            mine={message.sessionId === session?.id}
            presenter={presenter}
            mode={mode}
          />
        ))}
        {busy && (
          <p
            className="flex items-center gap-2 text-xs text-muted-foreground"
            role="status"
          >
            <NeuronMascot
              icon
              decorative
              className="size-7 motion-safe:animate-pulse"
            />
            {t("thinking")}…
          </p>
        )}
        {ai?.status === "failed" && (
          <div
            className="rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-xs text-destructive"
            role="alert"
          >
            {errors(
              ai.error === "AI_INTERRUPTED"
                ? "AI_INTERRUPTED"
                : "AI_UNAVAILABLE",
            )}
            {presenter && (
              <Button variant="ghost" size="sm" onClick={retryAi}>
                <RotateCcw className="size-3" />
                {t("tryAgain")}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
