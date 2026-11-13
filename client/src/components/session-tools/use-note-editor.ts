"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import * as Y from "yjs";
import { useAppSelector } from "@/lib/hooks";
import { applyNote, editNote, encodeNote } from "@/lib/note-document";
import {
  studyError,
  useSaveNoteMutation,
  useStudyNoteQuery,
} from "@/lib/study-tools-api";

export function useNoteEditor(roomId: string, id: string) {
  const sessionId = useAppSelector((state) => state.chat.session?.id);
  const key = `pairup.note-draft:${sessionId}:${roomId}:${id}`;
  const {
    data,
    error: loadError,
    isLoading,
    refetch,
  } = useStudyNoteQuery(
    { roomId, id },
    { pollingInterval: 15000, refetchOnMountOrArgChange: true },
  );
  const [send] = useSaveNoteMutation();
  const [doc] = useState(() => new Y.Doc());
  const [value, setValue] = useState({ title: "", body: "" });
  const [status, setStatus] = useState("saved");
  const [error, setError] = useState("");
  const revision = useRef(0),
    dirty = useRef(false),
    sending = useRef(false),
    alive = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const flushRef = useRef<() => Promise<void>>(async () => {});
  const flush = useCallback(async () => {
    clearTimeout(timer.current);
    if (!dirty.current || sending.current) return;
    sending.current = true;
    const sent = revision.current;
    const state = encodeNote(doc);
    if (alive.current) {
      setStatus("saving");
      setError("");
    }
    let failed = false;
    try {
      const result = await send({ roomId, id, state }).unwrap();
      if (sent === revision.current) {
        dirty.current = false;
        try {
          // A reopened editor may already have stored a newer draft under this key.
          if (localStorage.getItem(key) === state) localStorage.removeItem(key);
        } catch {
          /* Server acknowledged the data. */
        }
        if (alive.current) setStatus("saved");
      }
      if (alive.current) applyNote(doc, result.state, "remote");
    } catch (cause) {
      failed = true;
      if (alive.current) {
        setStatus("unsaved");
        setError(studyError(cause));
      }
    } finally {
      sending.current = false;
      if (dirty.current && !failed && alive.current)
        timer.current = setTimeout(() => void flushRef.current(), 500);
    }
  }, [doc, id, key, roomId, send]);
  useEffect(() => {
    flushRef.current = flush;
  }, [flush]);
  useEffect(() => {
    alive.current = true;
    const changed = (_: Uint8Array, origin: unknown) => {
      setValue({
        title: doc.getText("title").toString(),
        body: doc.getText("body").toString(),
      });
      if (origin !== "remote") {
        revision.current++;
        dirty.current = true;
        setStatus("unsaved");
        clearTimeout(timer.current);
        timer.current = setTimeout(() => void flushRef.current(), 600);
      }
      if (dirty.current) {
        try {
          localStorage.setItem(key, encodeNote(doc));
        } catch {
          setError("DRAFT_STORAGE_ERROR");
        }
      }
    };
    doc.on("update", changed);
    queueMicrotask(() => {
      if (!alive.current) return;
      try {
        const cached = localStorage.getItem(key);
        if (cached) applyNote(doc, cached, "local");
      } catch {
        setError("DRAFT_STORAGE_ERROR");
      }
    });
    const reconnect = () => void flushRef.current();
    const warn = (event: BeforeUnloadEvent) => {
      if (dirty.current) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    window.addEventListener("online", reconnect);
    window.addEventListener("beforeunload", warn);
    return () => {
      alive.current = false;
      clearTimeout(timer.current);
      void flushRef.current();
      doc.off("update", changed);
      window.removeEventListener("online", reconnect);
      window.removeEventListener("beforeunload", warn);
      // React Strict Mode reuses this instance during its effect rehearsal.
      // No external document subscriptions remain after cleanup.
    };
  }, [doc, key]);
  useEffect(() => {
    if (data) applyNote(doc, data.state, "remote");
  }, [data, doc]);
  return {
    value,
    status,
    error: error || (loadError ? studyError(loadError) : ""),
    loading: isLoading,
    dirty: status !== "saved",
    version: data?.version,
    change: (field: "title" | "body", text: string) =>
      editNote(doc, field, text),
    retry: () => {
      void refetch();
      void flush();
    },
  };
}
