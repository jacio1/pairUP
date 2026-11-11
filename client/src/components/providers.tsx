"use client";
import { useState, useEffect } from "react";
import { Provider, useDispatch, useSelector } from "react-redux";
import { io } from "socket.io-client";
import {
  createStore,
  actions,
  api,
  useMeQuery,
  type Dispatch,
  type RootState,
  type Message,
  type AiStatus,
} from "@/lib/store";

export const useAppDispatch = useDispatch.withTypes<Dispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();
export let chatSocket: ReturnType<typeof io> | null = null;
function Connection() {
  const dispatch = useAppDispatch();
  const { data } = useMeQuery();
  const session = useAppSelector((s) => s.chat.session);
  useEffect(() => {
    if (data !== undefined) dispatch(actions.session(data));
  }, [data, dispatch]);
  const sessionId = session?.id;
  useEffect(() => {
    if (!sessionId) return;
    const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || undefined, {
      withCredentials: true,
      transports: ["websocket"],
      autoConnect: false,
    });
    chatSocket = socket;
    let disposed = false;
    let syncNumber = 0;
    let synchronizing = false;
    let bufferedAi: AiStatus | undefined;
    const buffer: Message[] = [];
    async function synchronize() {
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
              { after, syncId },
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
          setTimeout(() => {
            if (!disposed) void synchronize();
          }, 3000);
        }
      } finally {
        if (current === syncNumber) synchronizing = false;
      }
    }
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
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("online", goOnline);
      socket.disconnect();
      chatSocket = null;
      dispatch(actions.connected(false));
    };
  }, [sessionId, dispatch]);
  return null;
}
export function Providers({ children }: { children: React.ReactNode }) {
  const [store] = useState(createStore);
  return (
    <Provider store={store}>
      <Connection />
      {children}
    </Provider>
  );
}
