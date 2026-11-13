import { usePathname } from "next/navigation";
import { useEffect } from "react";

import { bindChatSocket } from "@/lib/chat-transport";
import { useAppDispatch, useAppSelector, useAppStore } from "@/lib/hooks";
import {
  actions,
  api,
  useMeQuery,
  type AiStatus,
  type Message,
} from "@/lib/store";
import { io } from "socket.io-client";
import { studyApi } from "@/lib/study-tools-api";
import { filesApi } from "@/lib/files-api";
export function useChatConnection() {
  const store = useAppStore();
  const dispatch = useAppDispatch();
  const pathname = usePathname();
  const roomId = pathname.startsWith("/messages/")
    ? pathname.split("/")[2]
    : null;
  const { data } = useMeQuery();
  const session = useAppSelector((s) => s.chat.session);
  useEffect(() => {
    if (data !== undefined) dispatch(actions.session(data));
  }, [data, dispatch]);
  const sessionId = session?.id;
  useEffect(() => {
    dispatch(actions.room(roomId));
    if (!sessionId) return;
    const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || undefined, {
      withCredentials: true,
      auth: roomId ? { roomId } : {},
      transports: ["websocket"],
      autoConnect: false,
    });
    const releaseSocket = bindChatSocket(socket);
    let disposed = false;
    let syncNumber = 0;
    let synchronizing = false;
    let bufferedAi: AiStatus | undefined;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;
    const buffer: Message[] = [];
    async function synchronize(fresh = false) {
      if (!roomId) return;
      clearTimeout(retryTimer);
      const current = ++syncNumber;
      const syncId = crypto.randomUUID();
      synchronizing = true;
      buffer.length = 0;
      bufferedAi = undefined;
      dispatch(actions.connected(false));
      try {
        const state = store.getState().chat;
        let after: number | undefined =
          !fresh && state.historyReady ? state.messages.at(-1)?.seq : undefined;
        do {
          const result = await dispatch(
            api.endpoints.snapshot.initiate(
              { after, syncId, roomId },
              {
                forceRefetch: true,
                subscribe: false,
              },
            ),
          ).unwrap();
          if (disposed || current !== syncNumber) return;
          if (
            after !== undefined &&
            result.generation !== store.getState().chat.generation
          ) {
            after = undefined;
            continue;
          }
          dispatch(actions.generation(result.generation));
          if (result.mode !== "after")
            dispatch(
              actions.history({
                roomId,
                generation: result.generation,
                hasOlder: result.hasOlder,
              }),
            );
          dispatch(
            actions.references({
              roomId,
              generation: result.generation,
              items: result.references,
            }),
          );
          dispatch(actions.merge(result.messages));
          dispatch(actions.ai(result.ai));
          if (!result.hasMore) break;
          after = result.messages.at(-1)!.seq;
        } while (!disposed);
        if (disposed || current !== syncNumber) return;
        dispatch(actions.merge(buffer));
        if (bufferedAi !== undefined) dispatch(actions.ai(bufferedAi));
        dispatch(actions.connected(socket.connected));
      } catch {
        if (!disposed) {
          dispatch(actions.connected(false));
          retryTimer = setTimeout(() => {
            if (!disposed) void synchronize();
          }, 3000);
        }
      } finally {
        if (current === syncNumber) synchronizing = false;
      }
    }
    socket.on("proposals:changed", () =>
      dispatch(api.util.invalidateTags(["Proposals"])),
    );
    socket.on("room:ready", () => {
      if (roomId)
        dispatch(
          filesApi.util.invalidateTags([{ type: "RoomFiles", id: roomId }]),
        );
      if (roomId)
        dispatch(
          studyApi.util.invalidateTags([
            { type: "StudyTools", id: roomId },
            "StudyNote",
          ]),
        );
      void synchronize();
    });
    socket.on(
      "tools:changed",
      (event: { roomId?: string; noteId?: string }) => {
        if (event?.roomId !== roomId) return;
        dispatch(
          studyApi.util.invalidateTags([
            { type: "StudyTools", id: roomId! },
            ...(event.noteId
              ? [{ type: "StudyNote" as const, id: event.noteId }]
              : []),
          ]),
        );
      },
    );
    socket.on("message:created", (m: Message) => {
      if (synchronizing) buffer.push(m);
      else dispatch(actions.merge([m]));
    });
    socket.on("files:changed", (event: { roomId?: string }) => {
      if (event?.roomId === roomId)
        dispatch(
          filesApi.util.invalidateTags([{ type: "RoomFiles", id: roomId! }]),
        );
    });
    socket.on("ai:status", (status: AiStatus) => {
      if (synchronizing) bufferedAi = status;
      else dispatch(actions.ai(status));
    });
    socket.on("room:reset", () => {
      void synchronize(true);
    });
    socket.on("session:expired", () => {
      dispatch(actions.session(null));
      dispatch(api.util.resetApiState());
    });
    socket.on("disconnect", () => dispatch(actions.connected(false)));
    socket.on("connect_error", () => dispatch(actions.connected(false)));
    const goOffline = () => socket.disconnect();
    const goOnline = () => socket.connect();
    window.addEventListener("offline", goOffline);
    window.addEventListener("online", goOnline);
    if (navigator.onLine) socket.connect();
    return () => {
      disposed = true;
      clearTimeout(retryTimer);
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("online", goOnline);
      socket.removeAllListeners();
      socket.disconnect();
      releaseSocket();
      dispatch(actions.connected(false));
    };
  }, [sessionId, roomId, dispatch, store]);
}
