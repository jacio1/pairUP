"use client";
import { MessageProfile } from "./message-profile";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MessageMenu } from "./message-menu";
import { type Message } from "@/lib/chat-types";
import { NeuronMascot } from "@/components/neuron-mascot";
import { useFormatter, useTranslations } from "next-intl";
import { AttachmentCard } from "@/components/files/attachment-card";
export function MessageItem({
  message,
  parent,
  mine,
  onReply,
  onAskNeuron,
  onJump,
  onDelete,
}: {
  message: Message;
  parent?: Pick<Message, "text">;
  mine: boolean;
  onReply: () => void;
  onAskNeuron?: () => void;
  onJump?: () => void;
  onDelete?: () => void;
}) {
  const t = useTranslations("Demo");
  const extra = useTranslations("ChatExtras");
  const format = useFormatter();
  const neuron = message.kind === "ai";
  const media =
    message.attachment?.kind === "image" ||
    message.attachment?.kind === "video";
  return (
    <article
      key={message.id}
      data-message-id={message.id}
      tabIndex={-1}
      className={`flex items-end gap-2 rounded-lg outline-none ${mine ? "flex-row-reverse" : ""}`}
    >
      {!mine && (
        <Avatar className="mb-1 size-7 shrink-0 after:pointer-events-none">
          <AvatarFallback
            className={`text-[10px] ${neuron ? "bg-primary/10 text-primary" : ""}`}
          >
            {neuron ? (
              <NeuronMascot icon decorative className="size-7" />
            ) : (
              <MessageProfile message={message}>
                {message.author.slice(0, 1)}
              </MessageProfile>
            )}
          </AvatarFallback>
        </Avatar>
      )}
      <div
        className={
          media
            ? "min-w-0 w-[85%] max-w-[420px] sm:w-[75%]"
            : "min-w-0 max-w-[85%] sm:max-w-[75%]"
        }
      >
        <MessageMenu
          onReply={onReply}
          onAskNeuron={onAskNeuron}
          onDelete={onDelete}
        >
          <div
            className={
              media
                ? "min-w-0"
                : `rounded-2xl px-4 py-3 ${mine ? "rounded-br-md bg-[var(--message-sent)] text-[var(--message-sent-foreground)]" : "rounded-bl-md border border-border bg-card"}`
            }
          >
            {!mine && (
              <p className="mb-1 text-[11px] font-semibold text-primary">
                {neuron ? t("neuron") : <MessageProfile message={message} />}
              </p>
            )}
            {message.kind === "ai-request" && (
              <span
                className={`mb-2 flex items-center gap-1.5 text-xs font-medium ${mine ? "text-[var(--message-sent-foreground)]" : "text-muted-foreground"}`}
              >
                <NeuronMascot icon decorative className="size-5" />
                {t("askedNeuron")}
              </span>
            )}
            {message.targetMessageId && (
              <blockquote
                className={`mb-3 line-clamp-3 rounded-r-md border-l-2 px-3 py-2 text-[13px] leading-6 ${mine ? "border-[var(--message-sent-foreground)] bg-white/10 text-[var(--message-sent-foreground)] dark:bg-white/5" : "border-primary/50 bg-muted/60 text-foreground"}`}
              >
                {parent && onJump ? (
                  <button
                    type="button"
                    onClick={onJump}
                    className="block w-full cursor-pointer text-left"
                    aria-label={extra("jumpToMessage", {
                      text: parent.text.slice(0, 160),
                    })}
                  >
                    {parent.text.slice(0, 160)}
                  </button>
                ) : (
                  parent?.text.slice(0, 160) || extra("messageUnavailable")
                )}
              </blockquote>
            )}
            {message.attachment ? (
              <AttachmentCard file={message.attachment} />
            ) : (
              <p className="text-[15px] font-medium leading-7 whitespace-pre-wrap wrap-anywhere">
                {message.text}
              </p>
            )}
            <time
              className={`mt-2 block text-right text-[11px] tabular-nums ${mine && !media ? "text-[var(--message-sent-foreground)]" : "text-muted-foreground"}`}
              dateTime={message.createdAt}
            >
              {format.dateTime(new Date(message.createdAt), {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </time>
          </div>
        </MessageMenu>
      </div>
    </article>
  );
}
