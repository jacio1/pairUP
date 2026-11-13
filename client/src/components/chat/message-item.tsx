"use client";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { type Message } from "@/lib/store";
import { NeuronMascot } from "@/components/neuron-mascot";
import { useFormatter, useTranslations } from "next-intl";
import { AttachmentCard } from "@/components/files/attachment-card";
export function MessageItem({
  message,
  parent,
  mine,
  presenter,
  mode,
}: {
  message: Message;
  parent?: Message;
  mine: boolean;
  presenter: boolean;
  mode: (message: Message) => void;
}) {
  const t = useTranslations("Demo");
  const format = useFormatter();
  const neuron = message.kind === "ai";
  return (
    <article
      key={message.id}
      className={`flex items-end gap-2 ${mine ? "flex-row-reverse" : ""}`}
    >
      {!mine && (
        <Avatar className="mb-1 size-7 shrink-0">
          <AvatarFallback
            className={`text-[10px] ${neuron ? "bg-primary/10 text-primary" : ""}`}
          >
            {neuron ? (
              <NeuronMascot icon decorative className="size-7" />
            ) : (
              message.author.slice(0, 1)
            )}
          </AvatarFallback>
        </Avatar>
      )}
      <div className="min-w-0 max-w-[85%] sm:max-w-[75%]">
        <div
          className={`rounded-2xl px-4 py-3 ${mine ? "rounded-br-md bg-[var(--message-sent)] text-[var(--message-sent-foreground)]" : "rounded-bl-md border border-border bg-card"}`}
        >
          {!mine && (
            <p className="mb-1 text-[11px] font-semibold text-primary">
              {neuron ? t("neuron") : message.author}
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
          {parent && (
            <blockquote
              className={`mb-3 line-clamp-3 rounded-r-md border-l-2 px-3 py-2 text-[13px] leading-6 ${mine ? "border-[var(--message-sent-foreground)] bg-white/10 text-[var(--message-sent-foreground)] dark:bg-white/5" : "border-primary/50 bg-muted/60 text-foreground"}`}
            >
              {parent.text.slice(0, 160)}
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
            className={`mt-2 block text-right text-[11px] tabular-nums ${mine ? "text-[var(--message-sent-foreground)]" : "text-muted-foreground"}`}
            dateTime={message.createdAt}
          >
            {format.dateTime(new Date(message.createdAt), {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </time>
        </div>
        {presenter && (
          <Button
            variant="ghost"
            size="xs"
            className={`mt-1 h-8 gap-1 text-xs text-muted-foreground ${mine ? "ml-auto flex" : ""}`}
            onClick={() => mode(message)}
            aria-label={t("askAboutMessage")}
          >
            <NeuronMascot icon decorative className="size-5" />
            {t("askNeuron")}
          </Button>
        )}
      </div>
    </article>
  );
}
