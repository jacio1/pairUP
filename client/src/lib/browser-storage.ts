"use client";
import { useMemo, useSyncExternalStore } from "react";
const changed = "pairup:local-data";
function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(changed, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(changed, callback);
  };
}
export function useBrowserStorage<T>(key: string, fallback: T) {
  const raw = useSyncExternalStore(
    subscribe,
    () => {
      try {
        return localStorage.getItem(key);
      } catch {
        return null;
      }
    },
    () => null,
  );
  const value = useMemo(() => {
    try {
      if (!raw) return fallback;
      const parsed: unknown = JSON.parse(raw);
      if (typeof fallback === "object" && fallback !== null) {
        if (
          typeof parsed !== "object" ||
          parsed === null ||
          Array.isArray(parsed)
        )
          return fallback;
        return Object.fromEntries(
          Object.entries(fallback).map(([key, value]) => [
            key,
            typeof (parsed as Record<string, unknown>)[key] === typeof value
              ? (parsed as Record<string, unknown>)[key]
              : value,
          ]),
        ) as T;
      }
      return typeof parsed === typeof fallback ? (parsed as T) : fallback;
    } catch {
      return fallback;
    }
  }, [raw, fallback]);
  function save(next: T) {
    try {
      localStorage.setItem(key, JSON.stringify(next));
      window.dispatchEvent(new Event(changed));
      return true;
    } catch {
      return false;
    }
  }
  return [value, save] as const;
}
