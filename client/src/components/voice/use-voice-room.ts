"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { ConnectionState, Room, RoomEvent, Track } from "livekit-client";

export function useVoiceRoom(roomId: string, sessionId?: number) {
  const current = useRef<Room | null>(null);
  const attempt = useRef(0);
  const expiry = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const audio = useRef(new Set<HTMLMediaElement>());
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const [muted, setMuted] = useState(true);
  const [audioBlocked, setAudioBlocked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [participants, setParticipants] = useState<
    { id: string; name: string; speaking: boolean; muted: boolean }[]
  >([]);
  const leave = useCallback(() => {
    attempt.current++;
    clearTimeout(expiry.current);
    const room = current.current;
    current.current = null;
    room?.removeAllListeners();
    void room?.disconnect();
    audio.current.forEach((element) => element.remove());
    audio.current.clear();
    setParticipants([]);
    setStatus("idle");
    setMuted(true);
    setBusy(false);
    setAudioBlocked(false);
  }, []);
  useEffect(() => () => leave(), [roomId, sessionId, leave]);

  async function join() {
    if (current.current || !sessionId) return;
    const room = new Room({
      adaptiveStream: true,
      disconnectOnPageLeave: true,
    });
    current.current = room;
    const version = ++attempt.current;
    const active = () =>
      current.current === room && version === attempt.current;
    setError("");
    setStatus("connecting");
    const sync = () => {
      if (!active()) return;
      const all = [room.localParticipant, ...room.remoteParticipants.values()];
      setParticipants(
        all.map((p) => ({
          id: p.identity,
          name: p.name || p.identity,
          speaking: p.isSpeaking,
          muted: !p.isMicrophoneEnabled,
        })),
      );
      setMuted(!room.localParticipant.isMicrophoneEnabled);
    };
    room
      .on(RoomEvent.ParticipantConnected, sync)
      .on(RoomEvent.ParticipantDisconnected, sync)
      .on(RoomEvent.ActiveSpeakersChanged, sync)
      .on(RoomEvent.TrackMuted, sync)
      .on(RoomEvent.TrackUnmuted, sync)
      .on(RoomEvent.LocalTrackPublished, sync)
      .on(RoomEvent.ConnectionStateChanged, (state) => {
        if (active())
          setStatus(
            state === ConnectionState.Reconnecting ||
              state === ConnectionState.SignalReconnecting
              ? "reconnecting"
              : state === ConnectionState.Connected
                ? "connected"
                : "connecting",
          );
      })
      .on(RoomEvent.AudioPlaybackStatusChanged, () => {
        if (active()) setAudioBlocked(!room.canPlaybackAudio);
      })
      .on(RoomEvent.TrackSubscribed, (track) => {
        if (!active() || track.kind !== Track.Kind.Audio) return;
        const element = track.attach();
        audio.current.add(element);
        document.body.appendChild(element);
      })
      .on(RoomEvent.TrackUnsubscribed, (track) =>
        track.detach().forEach((element) => {
          element.remove();
          audio.current.delete(element);
        }),
      )
      .on(RoomEvent.Disconnected, () => {
        if (active()) {
          leave();
          setError("disconnected");
        }
      });
    try {
      const response = await fetch(
        `/api/rooms/${encodeURIComponent(roomId)}/voice/token`,
        { method: "POST", credentials: "include", cache: "no-store" },
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.code || "connectionError");
      if (!active()) return;
      await room.connect(data.url, data.token);
      if (!active()) {
        await room.disconnect();
        return;
      }
      // Joining is listen-only. Microphone capture requires a separate explicit action.
      sync();
      expiry.current = setTimeout(
        () => {
          if (active()) {
            leave();
            setError("UNAUTHORIZED");
          }
        },
        Math.max(0, new Date(data.expiresAt).getTime() - Date.now()),
      );
      try {
        await room.startAudio();
      } catch {
        if (active()) setAudioBlocked(true);
      }
    } catch (cause) {
      if (!active()) return;
      leave();
      const code = cause instanceof Error ? cause.message : "connectionError";
      setError(
        [
          "VOICE_UNAVAILABLE",
          "UNAUTHORIZED",
          "FORBIDDEN",
          "RATE_LIMIT",
        ].includes(code)
          ? code
          : "connectionError",
      );
    }
  }
  async function toggleMicrophone() {
    const room = current.current;
    if (!room || busy) return;
    setBusy(true);
    setError("");
    try {
      await room.localParticipant.setMicrophoneEnabled(
        !room.localParticipant.isMicrophoneEnabled,
        {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      );
      if (current.current !== room) {
        await room.localParticipant.setMicrophoneEnabled(false);
        return;
      }
      if (current.current === room)
        setMuted(!room.localParticipant.isMicrophoneEnabled);
    } catch {
      if (current.current === room) setError("microphoneError");
    } finally {
      if (current.current === room) setBusy(false);
    }
  }
  async function enableAudio() {
    try {
      await current.current?.startAudio();
    } catch {
      setError("playbackError");
    }
  }
  return {
    status,
    error,
    muted,
    busy,
    participants,
    audioBlocked,
    join,
    leave,
    toggleMicrophone,
    enableAudio,
  };
}
