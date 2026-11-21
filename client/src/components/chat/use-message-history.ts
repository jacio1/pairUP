"use client";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { actions } from "@/lib/chat-state";
import { api } from "@/lib/api";
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
  const jumpAfterRender = useRef<{ id: string; from: string } | null>(null);
  const end = useRef<HTMLDivElement>(null);
  const highlight = useRef<Animation | null>(null);
  const [awayFromEnd, setAwayFromEnd] = useState(false);
  const [returnTo, setReturnTo] = useState<{
    roomId: string | null;
    generation: number;
    id: string;
  } | null>(null);
  const returnId =
    returnTo?.roomId === roomId &&
    returnTo.generation === generation &&
    messages.some((message) => message.id === returnTo.id)
      ? returnTo.id
      : null;
  useEffect(() => {
    const marker = end.current;
    const root = viewport.current;
    if (!marker || !root) return;
    const observer = new IntersectionObserver(
      ([entry]) => setAwayFromEnd(!entry.isIntersecting),
      { root, rootMargin: "0px 0px 76px 0px" },
    );
    observer.observe(marker);
    return () => observer.disconnect();
  }, []);
  const olderCursor = useRef<{
    roomId: string;
    generation: number;
    seq: number;
  } | null>(null);
  const [loading, setLoading] = useState(false),
    [error, setError] = useState(false);
  async function older(jumpTarget?: { id: string; from: string }) {
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
      const cursor = olderCursor.current;
      let before =
        cursor?.roomId === roomId && cursor.generation === generation
          ? Math.min(cursor.seq, messages[0].seq)
          : messages[0].seq;
      for (;;) {
        const result = await dispatch(
          api.endpoints.snapshot.initiate(
            {
              roomId,
              before,
              generation,
              syncId: crypto.randomUUID(),
            },
            { subscribe: false, forceRefetch: true },
          ),
        ).unwrap();
        const state = store.getState().chat;
        if (state.roomId !== roomId || state.generation !== generation) return;
        const next = result.messages[0]?.seq;
        if (next !== undefined)
          olderCursor.current = { roomId, generation, seq: next };
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
        const found =
          jumpTarget &&
          result.messages.some(
            (message) =>
              message.id === jumpTarget.id && message.kind !== "deleted",
          );
        if (found) jumpAfterRender.current = jumpTarget;
        dispatch(
          actions.references({ roomId, generation, items: result.references }),
        );
        dispatch(actions.merge(result.messages));
        dispatch(
          actions.history({ roomId, generation, hasOlder: result.hasOlder }),
        );
        if (
          !jumpTarget ||
          found ||
          !result.hasOlder ||
          next === undefined ||
          next >= before
        )
          break;
        before = next;
      }
    } catch {
      anchor.current = null;
      setError(true);
    } finally {
      pending.current = false;
      setLoading(false);
    }
  }
  const findMessage = useCallback((id: string) => {
    return viewport.current?.querySelector<HTMLElement>(
      `[data-message-id="${CSS.escape(id)}"]`,
    );
  }, []);
  const scrollToMessage = useCallback(
    async (id: string, from?: string) => {
      const element = findMessage(id);
      const node = viewport.current;
      if (!element || !node) return;
      if (from) setReturnTo({ roomId, generation, id: from });
      bottom.current = false;
      const reduceMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      const top =
        node.scrollTop +
        element.getBoundingClientRect().top -
        node.getBoundingClientRect().top -
        (node.clientHeight - element.offsetHeight) / 2;
      await node.scrollTo({
        top,
        behavior: reduceMotion ? "instant" : "smooth",
      });
      if (!element.isConnected) return;
      element.focus({ preventScroll: true });
      if (from) {
        highlight.current?.cancel();
        highlight.current = element.animate(
          [
            {
              backgroundColor:
                "color-mix(in srgb, var(--primary) 26%, transparent)",
              offset: 0,
            },
            {
              backgroundColor:
                "color-mix(in srgb, var(--primary) 26%, transparent)",
              offset: 0.2,
            },
            { backgroundColor: "transparent" },
          ],
          { duration: reduceMotion ? 550 : 1600, easing: "ease-out" },
        );
      }
    },
    [findMessage, generation, roomId],
  );
  function jump(id: string, from: string) {
    if (findMessage(id)) void scrollToMessage(id, from);
    else void older({ id, from });
  }
  function goDown() {
    const node = viewport.current;
    if (!node) return;
    setReturnTo(null);
    if (returnId && findMessage(returnId)) {
      void scrollToMessage(returnId);
      return;
    }
    node.focus({ preventScroll: true });
    node.scrollTo({
      top: node.scrollHeight,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
    });
  }
  useLayoutEffect(() => {
    const node = viewport.current;
    if (!node) return;
    if (previousRoom.current !== roomId) {
      previousRoom.current = roomId;
      bottom.current = true;
      anchor.current = null;
      jumpAfterRender.current = null;
    }
    if (anchor.current) {
      const el = Array.from(
        node.querySelectorAll<HTMLElement>("[data-message-id]"),
      ).find((el) => el.dataset.messageId === anchor.current!.id);
      if (el)
        node.scrollTop += el.getBoundingClientRect().top - anchor.current.top;
      anchor.current = null;
    } else if (bottom.current && !jumpAfterRender.current)
      node.scrollTop = node.scrollHeight;
    if (jumpAfterRender.current) {
      const { id, from } = jumpAfterRender.current;
      jumpAfterRender.current = null;
      void scrollToMessage(id, from);
    }
  }, [messages, historyReady, roomId, scrollToMessage]);
  function onScroll() {
    const node = viewport.current;
    if (!node) return;
    bottom.current =
      node.scrollHeight - node.scrollTop - node.clientHeight < 100;
    if (node.scrollTop < 80 && !error) void older();
  }
  return {
    viewport,
    end,
    onScroll,
    older,
    jump,
    goDown,
    showDown: historyReady && (awayFromEnd || !!returnId),
    returningToReply: !!returnId,
    loading,
    error,
    hasOlder,
    historyReady,
  };
}
