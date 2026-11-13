"use client";
import {
  useEffect,
  useRef,
  useState,
  type PointerEvent,
  type KeyboardEvent,
} from "react";
import { useBrowserStorage } from "@/lib/browser-storage";
export function useToolResize() {
  const sidebar = useRef<HTMLElement>(null),
    [stored, save] = useBrowserStorage("pairup.tools-width", 440),
    [draft, setDraft] = useState<number | null>(null),
    [max, setMax] = useState(1000);
  const drag = useRef<{ x: number; width: number; value: number } | null>(null),
    restore = useRef<(() => void) | null>(null);
  const clamp = (value: number) =>
    Math.round(Math.max(320, Math.min(max, value)));
  const width = clamp(draft ?? stored);
  useEffect(() => {
    const parent = sidebar.current?.parentElement;
    if (!parent) return;
    const observer = new ResizeObserver((entries) => {
      const width = entries[0].contentRect.width;
      setMax(Math.max(320, Math.min(width - 360, width * 0.72)));
    });
    observer.observe(parent);
    return () => {
      observer.disconnect();
      restore.current?.();
    };
  }, []);
  function start(event: PointerEvent<HTMLDivElement>) {
    if (event.button !== 0) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    const value = sidebar.current?.getBoundingClientRect().width || width;
    drag.current = { x: event.clientX, width: value, value };
    setDraft(value);
    const { cursor, userSelect } = document.body.style;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    restore.current = () => {
      document.body.style.cursor = cursor;
      document.body.style.userSelect = userSelect;
    };
  }
  function move(event: PointerEvent<HTMLDivElement>) {
    if (!drag.current) return;
    const value = clamp(drag.current.width + drag.current.x - event.clientX);
    drag.current.value = value;
    setDraft(value);
  }
  function end(event: PointerEvent<HTMLDivElement>) {
    if (!drag.current) return;
    save(drag.current.value);
    drag.current = null;
    setDraft(null);
    restore.current?.();
    restore.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId);
  }
  function keyboard(event: KeyboardEvent<HTMLDivElement>) {
    const value =
      event.key === "ArrowLeft"
        ? width + 32
        : event.key === "ArrowRight"
          ? width - 32
          : event.key === "Home"
            ? 320
            : event.key === "End"
              ? max
              : null;
    if (value === null) return;
    event.preventDefault();
    save(clamp(value));
  }
  return {
    sidebar,
    width,
    max,
    handle: {
      onPointerDown: start,
      onPointerMove: move,
      onPointerUp: end,
      onPointerCancel: end,
      onKeyDown: keyboard,
      onDoubleClick: () => save(clamp(440)),
    },
  };
}
