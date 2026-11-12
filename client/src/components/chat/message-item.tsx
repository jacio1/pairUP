"use client";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { type Message } from "@/lib/store";
import { Sparkles } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
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
              <Sparkles className="size-3.5" />
            ) : (
              message.author.slice(0, 1)
            )}
          </AvatarFallback>
        </Avatar>
      )}
      <div className="min-w-0 max-w-[85%] sm:max-w-[75%]">
        <div
          className={`rounded-2xl px-3.5 py-2.5 shadow-xs ${mine ? "rounded-br-md bg-primary text-primary-foreground" : "rounded-bl-md border border-border/60 bg-card"}`}
        >
          {!mine && (
            <p className="mb-1 text-[11px] font-semibold text-primary">
              {neuron ? t("neuron") : message.author}
            </p>
          )}
          {message.kind === "ai-request" && (
            <span
              className={`mb-1.5 flex items-center gap-1 text-[10px] ${mine ? "text-primary-foreground/75" : "text-muted-foreground"}`}
            >
              <Sparkles className="size-3" />
              {t("askedNeuron")}
            </span>
          )}
          {parent && (
            <blockquote
              className={`mb-2 line-clamp-3 border-l-2 py-1 pl-2 text-xs ${mine ? "border-primary-foreground/50 text-primary-foreground/80" : "border-primary/30 text-muted-foreground"}`}
            >
              {parent.text.slice(0, 160)}
            </blockquote>
          )}
          <p className="text-sm leading-6 whitespace-pre-wrap wrap-anywhere">
            {message.text}
          </p>
          <time
            className={`mt-1 block text-right text-[10px] ${mine ? "text-primary-foreground/65" : "text-muted-foreground"}`}
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
            className={`mt-1 h-6 gap-1 text-[10px] text-muted-foreground ${mine ? "ml-auto flex" : ""}`}
            onClick={() => mode(message)}
            aria-label={t("askAboutMessage")}
          >
            <Sparkles className="size-3" />
            {t("askNeuron")}
          </Button>
        )}
      </div>
    </article>
  );
}
