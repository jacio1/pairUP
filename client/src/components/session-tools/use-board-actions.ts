"use client";
import { useRef, useState } from "react";
import {
  useRoomBoardQuery,
  useChangeBoardMutation,
  type BoardElement,
} from "@/lib/room-activities-api";
import { useAppSelector } from "@/lib/hooks";
import { studyError } from "@/lib/study-tools-api";
type Pending = { element: BoardElement; generation: number };
export function useBoardActions(roomId: string) {
  const connected = useAppSelector((s) => s.chat.connected);
  const {
    data,
    error: loadError,
    refetch,
  } = useRoomBoardQuery(roomId, {
    pollingInterval: 20000,
    refetchOnMountOrArgChange: true,
  });
  const [mutate] = useChangeBoardMutation();
  const [pending, setPending] = useState<Pending[]>([]),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const inFlight = useRef(new Set<string>());
  async function save(item: Pending) {
    if (inFlight.current.has(item.element.id)) return;
    inFlight.current.add(item.element.id);
    try {
      await mutate({ roomId, action: "add", ...item }).unwrap();
      await refetch().unwrap();
      setPending((list) =>
        list.filter((p) => p.element.id !== item.element.id),
      );
    } catch (e) {
      setError(studyError(e));
      void refetch();
    } finally {
      inFlight.current.delete(item.element.id);
    }
  }
  function add(element: BoardElement) {
    if (!data || !connected) return;
    const item = { element, generation: data.generation };
    setPending((list) => [...list, item]);
    setError("");
    void save(item);
  }
  async function command(action: "remove" | "clear", id?: string) {
    if (!data || busy || !connected || pending.length) return;
    setBusy(true);
    setError("");
    try {
      await mutate({
        roomId,
        action,
        id,
        generation: data.generation,
        version: data.version,
      }).unwrap();
      await refetch().unwrap();
    } catch (e) {
      setError(studyError(e));
      void refetch();
    } finally {
      setBusy(false);
    }
  }
  function retry() {
    setError("");
    void refetch();
    if (connected) pending.forEach((item) => void save(item));
  }
  const known = new Set(data?.elements.map((e) => e.id));
  return {
    data,
    elements: [
      ...(data?.elements || []),
      ...pending.filter((p) => !known.has(p.element.id)).map((p) => p.element),
    ],
    pending: pending.length,
    error: error || (loadError ? studyError(loadError) : ""),
    busy,
    connected,
    add,
    command,
    retry,
    discard: () => {
      setPending([]);
      setError("");
    },
  };
}
