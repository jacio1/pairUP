"use client";
import { useLayoutEffect, useRef, useState } from "react";
import { actions, api } from "@/lib/store";
import { useAppDispatch, useAppSelector, useAppStore } from "@/lib/hooks";
export function useMessageHistory() {
  const dispatch = useAppDispatch(),
    store = useAppStore();
  const { roomId, generation, messages, historyReady, hasOlder } =
    useAppSelector((s) => s.chat);
  const viewport = useRef<HTMLDivElement>(null),
    pending = useRef(false),
    bottom = useRef(true);
  const previousRoom = useRef(roomId);
  const anchor = useRef<{ id: string; top: number } | null>(null);
  const [loading, setLoading] = useState(false),
    [error, setError] = useState(false);
  async function older() {
    if (
      pending.current ||
      !roomId ||
      !historyReady ||
      !hasOlder ||
      !messages.length
    )
      return;
    pending.current = true;
    setLoading(true);
    setError(false);

    try {
      const result = await dispatch(
        api.endpoints.snapshot.initiate(
          {
            roomId,
            before: messages[0].seq,
            generation,
            syncId: crypto.randomUUID(),
          },
          { subscribe: false, forceRefetch: true },
        ),
      ).unwrap();
      const state = store.getState().chat;
      if (state.roomId !== roomId || state.generation !== generation) return;
      const node = viewport.current;
      const visible =
        node &&
        Array.from(
          node.querySelectorAll<HTMLElement>("[data-message-id]"),
        ).find(
          (el) =>
            el.getBoundingClientRect().bottom >
            node.getBoundingClientRect().top,
        );
      if (visible)
        anchor.current = {
          id: visible.dataset.messageId!,
          top: visible.getBoundingClientRect().top,
        };
      dispatch(
        actions.references({ roomId, generation, items: result.references }),
      );
      dispatch(actions.merge(result.messages));
      dispatch(
        actions.history({ roomId, generation, hasOlder: result.hasOlder }),
      );
    } catch {
      anchor.current = null;
      setError(true);
    } finally {
      pending.current = false;
      setLoading(false);
    }
  }
  useLayoutEffect(() => {
    const node = viewport.current;
    if (!node) return;
    if (previousRoom.current !== roomId) {
      previousRoom.current = roomId;
      bottom.current = true;
      anchor.current = null;
    }
    if (anchor.current) {
      const el = Array.from(
        node.querySelectorAll<HTMLElement>("[data-message-id]"),
      ).find((el) => el.dataset.messageId === anchor.current!.id);
      if (el)
        node.scrollTop += el.getBoundingClientRect().top - anchor.current.top;
      anchor.current = null;
    } else if (bottom.current) node.scrollTop = node.scrollHeight;
  }, [messages, historyReady, roomId]);
  function onScroll() {
    const node = viewport.current;
    if (!node) return;
    bottom.current =
      node.scrollHeight - node.scrollTop - node.clientHeight < 100;
    if (node.scrollTop < 80 && !error) void older();
  }
  return { viewport, onScroll, older, loading, error, hasOlder, historyReady };
}
