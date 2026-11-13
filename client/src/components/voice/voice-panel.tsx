"use client";
import { Headphones, Mic, MicOff, PhoneOff, Volume2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { useAppSelector } from "@/lib/hooks";
import { useVoiceRoom } from "./use-voice-room";

export function VoicePanel({ roomId }: { roomId: string }) {
  const session = useAppSelector((state) => state.chat.session);
  const voice = useVoiceRoom(roomId, session?.id);
  const t = useTranslations("Voice");
  if (!session) return null;
  const joined =
    voice.status === "connected" || voice.status === "reconnecting";
  return (
    <section
      aria-label={t("title")}
      className="shrink-0 border-b bg-card px-3 py-2.5 sm:px-6"
    >
      <div className="flex flex-wrap items-center gap-2">
        <Headphones className="size-4 text-primary" />
        <span className="text-sm font-medium">{t("title")}</span>
        <span role="status" className="mr-auto text-xs text-muted-foreground">
          {t(voice.status)}
        </span>
        {voice.status === "idle" ? (
          <Button
            size="sm"
            variant="secondary"
            onClick={() => void voice.join()}
          >
            {t("join")}
          </Button>
        ) : (
          <>
            {joined && (
              <Button
                size="sm"
                variant={voice.muted ? "outline" : "secondary"}
                disabled={voice.busy || voice.status !== "connected"}
                aria-pressed={!voice.muted}
                onClick={() => void voice.toggleMicrophone()}
              >
                {voice.muted ? <MicOff /> : <Mic />}
                {t(voice.muted ? "unmute" : "mute")}
              </Button>
            )}
            <Button
              size="sm"
              variant="destructive"
              onClick={voice.leave}
              aria-label={t("leave")}
            >
              <PhoneOff />
              <span className="hidden sm:inline">{t("leave")}</span>
            </Button>
          </>
        )}
        {voice.audioBlocked && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => void voice.enableAudio()}
          >
            <Volume2 />
            {t("enableAudio")}
          </Button>
        )}
      </div>
      {voice.participants.length > 0 && (
        <ul
          aria-label={t("participants")}
          className="mt-2 flex gap-2 overflow-x-auto pb-1"
        >
          {voice.participants.map((p) => (
            <li
              key={p.id}
              className={`flex shrink-0 items-center gap-1 rounded-full border px-2 py-1 text-xs ${p.speaking ? "border-primary bg-primary/10 text-primary" : "text-muted-foreground"}`}
            >
              {p.muted ? (
                <MicOff className="size-3" />
              ) : (
                <Mic className="size-3" />
              )}
              {p.name}
              <span className="sr-only">
                {t(p.speaking ? "speaking" : p.muted ? "muted" : "listening")}
              </span>
            </li>
          ))}
        </ul>
      )}
      {voice.error && (
        <p role="alert" className="mt-2 text-xs text-destructive">
          {t(voice.error)}
        </p>
      )}
    </section>
  );
}
