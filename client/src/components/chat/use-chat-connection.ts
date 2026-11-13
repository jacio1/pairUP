import { usePathname } from "next/navigation";
import { useEffect } from "react";

import { bindChatSocket } from "@/lib/chat-transport";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import {
  actions,
  api,
  useMeQuery,
  type AiStatus,
  type Message,
} from "@/lib/store";
import { io } from "socket.io-client";
export function useChatConnection() {
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
    async function synchronize() {
      if (!roomId) return;
      clearTimeout(retryTimer);
      const current = ++syncNumber;
      const syncId = crypto.randomUUID();
      synchronizing = true;
      buffer.length = 0;
      bufferedAi = undefined;
      dispatch(actions.connected(false));
      try {
        let after = 0;
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
          dispatch(actions.generation(result.generation));
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
      void synchronize();
    });
    socket.on("message:created", (m: Message) => {
      if (synchronizing) buffer.push(m);
      else dispatch(actions.merge([m]));
    });
    socket.on("ai:status", (status: AiStatus) => {
      if (synchronizing) bufferedAi = status;
      else dispatch(actions.ai(status));
    });
    socket.on("room:reset", () => {
      void synchronize();
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
  }, [sessionId, roomId, dispatch]);
}
