"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAppDispatch } from "@/lib/hooks";
import { actions } from "@/lib/store";
import { ArrowUp, Paperclip, Sparkles, WifiOff } from "lucide-react";
import { useTranslations } from "next-intl";
import { NeuronContext } from "./neuron-context";
import type { ChatActions } from "./use-chat-actions";
export function ChatComposer({
  chat,
  onFiles,
}: {
  chat: Pick<
    ChatActions,
    | "connected"
    | "presenter"
    | "aiMode"
    | "mode"
    | "target"
    | "send"
    | "input"
    | "aiDraft"
    | "draft"
    | "sending"
    | "asking"
    | "busy"
    | "error"
  >;
  onFiles: () => void;
}) {
  const t = useTranslations("Demo");
  const room = useTranslations("Room");
  const errors = useTranslations("Errors");
  const dispatch = useAppDispatch();
  const {
    connected,
    presenter,
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
            disabled={!presenter}
            aria-describedby="neuron-access-hint"
            onClick={() =>
              aiMode ? dispatch(actions.mode({ enabled: false })) : mode()
            }
            aria-pressed={aiMode}
          >
            <Sparkles className="size-3.5" />
            {t("askNeuron")}
          </Button>
          <span
            id="neuron-access-hint"
            className="text-[10px] leading-4 text-muted-foreground"
          >
            {t(presenter ? "onlyHost" : "neuronHostOnly")}
          </span>
        </div>
        {aiMode && <NeuronContext chat={chat} />}
        <form className="flex items-center gap-2" onSubmit={send}>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onFiles}
            aria-label={room("files")}
          >
            <Paperclip className="size-5 text-muted-foreground" />
          </Button>
          <Input
            ref={input}
            className="h-11 min-w-0 flex-1 rounded-xl bg-muted/40 text-base shadow-none sm:text-sm"
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
          <Button
            type="submit"
            size="icon"
            className="size-11 rounded-xl"
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
