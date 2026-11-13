"use client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronLeft, GraduationCap, Trash2, Users } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import type { ChatActions } from "./use-chat-actions";
export function RoomHeader({
  chat,
}: {
  chat: Pick<
    ChatActions,
    "listing" | "connected" | "session" | "presenter" | "setConfirmReset"
  >;
}) {
  const t = useTranslations("Demo");
  const room = useTranslations("Room");
  const { listing, connected, session, presenter, setConfirmReset } = chat;
  return (
    <header className="flex h-16 shrink-0 items-center gap-3 border-b border-border bg-card px-3 sm:px-5">
      <Button
        nativeButton={false}
        render={<Link href="/messages" />}
        variant="ghost"
        size="icon"
        aria-label={t("backDiscover")}
      >
        <ChevronLeft className="size-5" />
      </Button>
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <GraduationCap className="size-6" />
      </span>
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-sm font-semibold sm:text-base">
          {listing?.title || "PairUp"}
        </h1>
        <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <span
            className={`size-1.5 rounded-full ${connected ? "bg-emerald-500" : "bg-muted-foreground/50"}`}
          />
          <span role="status">
            {session
              ? t(connected ? "connected" : "reconnecting")
              : room("englishSession")}
          </span>
        </p>
      </div>
      <Badge
        variant="outline"
        className="hidden gap-1.5 text-[11px] sm:inline-flex"
      >
        <Users className="size-3.5" />
        {room("studyRoom")}
      </Badge>
      {presenter && (
        <Button
          variant="ghost"
          size="icon"
          aria-label={t("clearChat")}
          title={t("clearChat")}
          onClick={() => setConfirmReset(true)}
        >
          <Trash2 className="size-4 text-muted-foreground" />
        </Button>
      )}
    </header>
  );
}
