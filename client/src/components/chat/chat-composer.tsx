"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAppDispatch } from "@/lib/hooks";
import { actions } from "@/lib/chat-state";
import { ArrowUp, Paperclip, Reply, WifiOff, X } from "lucide-react";
import { NeuronMascot } from "@/components/neuron-mascot";
import { useTranslations } from "next-intl";
import { NeuronContext } from "./neuron-context";
import type { ChatActions } from "./use-chat-actions";
import { useRoomUploads } from "@/components/files/upload-provider";
import { UploadProgress } from "@/components/files/upload-progress";
export function ChatComposer({
  chat,
}: {
  chat: Pick<
    ChatActions,
    | "connected"
    | "canAskNeuron"
    | "aiMode"
    | "mode"
    | "target"
    | "replyTo"
    | "send"
    | "input"
    | "aiDraft"
    | "draft"
    | "sending"
    | "asking"
    | "busy"
    | "error"
  >;
}) {
  const t = useTranslations("Demo");
  const room = useTranslations("Room");
  const extra = useTranslations("ChatExtras");
  const errors = useTranslations("Errors");
  const dispatch = useAppDispatch();
  const { choose } = useRoomUploads();
  const {
    connected,
    canAskNeuron,
    aiMode,
    mode,
    send,
    input,
    aiDraft,
    draft,
    sending,
    asking,
    busy,
    error,
  } = chat;
  return (
    <div className="shrink-0 border-t border-border bg-card px-3 pt-3 pb-[max(12px,env(safe-area-inset-bottom))] sm:px-6">
      <div className="mx-auto max-w-3xl">
        <UploadProgress />
        {!connected && (
          <p
            className="mb-2 flex items-center gap-1.5 text-[11px] text-muted-foreground"
            role="status"
          >
            <WifiOff className="size-3" />
            {t("reconnecting")}
          </p>
        )}
        <div className="mb-2 flex items-center gap-2">
          <Button
            variant={aiMode ? "secondary" : "outline"}
            size="sm"
            className="shrink-0 gap-1.5 text-primary"
            disabled={!canAskNeuron}
            aria-describedby="neuron-access-hint"
            onClick={() =>
              aiMode ? dispatch(actions.mode({ enabled: false })) : mode()
            }
            aria-pressed={aiMode}
          >
            <NeuronMascot icon decorative className="size-6" />
            {t("askNeuron")}
          </Button>
          <span
            id="neuron-access-hint"
            className="text-[10px] leading-4 text-muted-foreground"
          >
            {t("neuronHint")}
          </span>
        </div>
        {aiMode && <NeuronContext chat={chat} />}
        {!aiMode && chat.replyTo && (
          <div className="mb-2 flex items-center gap-2 rounded-lg border-l-2 border-primary bg-muted px-3 py-1.5">
            <Reply className="size-4 shrink-0 text-primary" />
            <div className="min-w-0 flex-1 text-xs">
              <p className="truncate font-semibold">
                {extra("replyingTo", { author: chat.replyTo.author })}
              </p>
              <p className="truncate text-muted-foreground">
                {chat.replyTo.text}
              </p>
            </div>
            <Button
              size="icon-sm"
              variant="ghost"
              aria-label={extra("cancelReply")}
              onClick={() => dispatch(actions.replyTo(null))}
            >
              <X className="size-4" />
            </Button>
          </div>
        )}
        <form className="flex items-center gap-2" onSubmit={send}>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={choose}
            aria-label={room("files")}
          >
            <Paperclip className="size-5 text-muted-foreground" />
          </Button>
          <div className="relative min-w-0 flex-1">
            {aiMode && (
              <NeuronMascot
                icon
                decorative
                className="pointer-events-none absolute top-1/2 left-2 z-10 size-7 -translate-y-1/2"
              />
            )}
            <Input
              ref={input}
              className={`h-12 w-full rounded-xl border-border bg-background text-base shadow-none sm:text-sm ${aiMode ? "border-primary/40 pl-11" : ""}`}
              aria-label={t(aiMode ? "askPlaceholder" : "messagePlaceholder")}
              placeholder={t(aiMode ? "askPlaceholder" : "messagePlaceholder")}
              value={aiMode ? aiDraft : draft}
              maxLength={aiMode ? 2000 : 1000}
              onChange={(event) =>
                dispatch(
                  aiMode
                    ? actions.aiDraft(event.target.value)
                    : actions.draft(event.target.value),
                )
              }
              onKeyDown={(event) => {
                if (
                  event.key === "Enter" &&
                  !event.shiftKey &&
                  !event.nativeEvent.isComposing
                ) {
                  event.preventDefault();
                  void send();
                }
              }}
            />
          </div>
          <Button
            type="submit"
            size="icon"
            className="size-12 rounded-xl"
            aria-label={t("send")}
            disabled={
              !connected ||
              sending ||
              asking ||
              !(aiMode ? aiDraft : draft).trim() ||
              (aiMode && busy)
            }
          >
            <ArrowUp className="size-5" />
          </Button>
        </form>
        {error && (
          <p className="mt-2 text-xs text-destructive" role="alert">
            {errors.has(error) ? errors(error) : errors("SERVER_ERROR")}
          </p>
        )}
      </div>
    </div>
  );
}
