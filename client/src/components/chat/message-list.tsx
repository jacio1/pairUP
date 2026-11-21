"use client";
import { Button } from "@/components/ui/button";
import { ArrowDown, RotateCcw } from "lucide-react";
import { NeuronMascot } from "@/components/neuron-mascot";
import { useTranslations } from "next-intl";
import { useMessageHistory } from "./use-message-history";
import { useAppSelector } from "@/lib/hooks";
import { useMemo, useState } from "react";
import { MessageItem } from "./message-item";
import { DeleteMessageDialog } from "./delete-message-dialog";
import type { Message } from "@/lib/chat-types";
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
    | "canAskNeuron"
    | "retryAi"
    | "reply"
    | "mode"
    | "remove"
  >;
}) {
  const t = useTranslations("Demo");
  const errors = useTranslations("Errors");
  const {
    session,
    messages,
    busy,
    ai,
    canAskNeuron,
    retryAi,
    reply,
    mode,
    remove,
  } = chat;
  const {
    viewport,
    end,
    onScroll,
    older,
    jump,
    goDown,
    showDown,
    returningToReply,
    loading,
    error,
    hasOlder,
  } = useMessageHistory();
  const [deleteTarget, setDeleteTarget] = useState<Message | null>(null);
  const extra = useTranslations("ChatExtras");
  const references = useAppSelector((s) => s.chat.references);
  const byId = useMemo(
    () => new Map(messages.map((m) => [m.id, m])),
    [messages],
  );
  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      <div
        ref={viewport}
        tabIndex={-1}
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
          {messages.map((message) => (
            <MessageItem
              key={message.id}
              message={message}
              parent={
                byId.get(message.targetMessageId || "") ||
                references[message.targetMessageId || ""]
              }
              mine={message.sessionId === session?.id}
              onReply={() => reply(message)}
              onAskNeuron={canAskNeuron ? () => mode(message) : undefined}
              onJump={
                message.targetMessageId && !loading
                  ? () => jump(message.targetMessageId!, message.id)
                  : undefined
              }
              onDelete={
                message.sessionId === session?.id && message.kind !== "ai"
                  ? () => setDeleteTarget(message)
                  : undefined
              }
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
              {canAskNeuron && (
                <Button variant="ghost" size="sm" onClick={retryAi}>
                  <RotateCcw className="size-3" />
                  {t("tryAgain")}
                </Button>
              )}
            </div>
          )}
        </div>
        <div ref={end} aria-hidden="true" className="h-px" />
      </div>
      {showDown && (
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="absolute right-4 bottom-3 z-10 size-10 rounded-full bg-background shadow-md sm:right-7"
          aria-label={extra(returningToReply ? "backToReply" : "latestMessage")}
          onClick={goDown}
        >
          <ArrowDown className="size-5" />
        </Button>
      )}
      {deleteTarget && (
        <DeleteMessageDialog
          message={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          remove={remove}
        />
      )}
    </div>
  );
}
