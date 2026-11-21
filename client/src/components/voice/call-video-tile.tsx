import { useEffect, useRef } from "react";
import { Track } from "livekit-client";
import { useTranslations } from "next-intl";
import type { CallVideo } from "./use-voice-room";

export function CallVideoTile({ video }: { video: CallVideo }) {
  const element = useRef<HTMLVideoElement>(null);
  const t = useTranslations("Voice");
  const screen = video.source === Track.Source.ScreenShare;
  const label = t(screen ? "sharedScreenOf" : "cameraOf", { name: video.name });

  useEffect(() => {
    const target = element.current;
    if (!target) return;
    video.track.attach(target);
    return () => {
      video.track.detach(target);
    };
  }, [video.track]);

  return (
    <figure className={screen ? "col-span-full" : "min-w-0"}>
      <video
        ref={element}
        aria-label={label}
        autoPlay
        playsInline
        muted
        controls={screen}
        className="aspect-video max-h-[32dvh] w-full rounded-lg bg-black object-contain"
      />
      <figcaption className="truncate px-1 text-xs text-muted-foreground">
        {label}
      </figcaption>
    </figure>
  );
}
