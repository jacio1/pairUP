"use client";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useAppDispatch } from "@/lib/hooks";
import { actions } from "@/lib/store";
import { filesApi, uploadFile } from "@/lib/files-api";

export type UploadJob = {
  id: string;
  name: string;
  progress: number;
  status: "queued" | "uploading" | "failed";
  error?: string;
};
type Uploads = {
  jobs: UploadJob[];
  choose: () => void;
  add: (files: File[]) => void;
  retry: (id: string) => void;
  cancel: (id: string) => void;
  error: string;
  clearError: () => void;
};
const UploadContext = createContext<Uploads | null>(null);
export const useRoomUploads = () => {
  const value = useContext(UploadContext);
  if (!value) throw new Error("Missing upload provider");
  return value;
};
export function RoomUploadProvider({
  roomId,
  children,
}: {
  roomId: string;
  children: React.ReactNode;
}) {
  const dispatch = useAppDispatch(),
    t = useTranslations("Files");
  const [jobs, setJobs] = useState<UploadJob[]>([]),
    [error, setError] = useState("");
  const input = useRef<HTMLInputElement>(null),
    items = useRef(
      new Map<string, { file: File; job: UploadJob; cancel?: () => void }>(),
    ),
    running = useRef(false),
    alive = useRef(true);
  const publish = () => {
    if (alive.current)
      setJobs([...items.current.values()].map((item) => ({ ...item.job })));
  };
  async function pump() {
    if (running.current) return;
    running.current = true;
    try {
      while (alive.current) {
        const item = [...items.current.values()].find(
          (item) => item.job.status === "queued",
        );
        if (!item) break;
        const { id } = item.job;
        item.job.status = "uploading";
        publish();
        const request = uploadFile(roomId, item.file, id, (progress) => {
          item.job.progress = progress;
          publish();
        });
        item.cancel = request.cancel;
        try {
          const result = await request.promise;
          if (alive.current) {
            if (result.message) dispatch(actions.merge([result.message]));
            dispatch(
              filesApi.util.invalidateTags([{ type: "RoomFiles", id: roomId }]),
            );
          }
          items.current.delete(id);
        } catch (cause) {
          if (items.current.has(id)) {
            item.job.status = "failed";
            item.job.error =
              cause instanceof Error ? cause.message : "UPLOAD_FAILED";
          }
        } finally {
          item.cancel = undefined;
          publish();
        }
      }
    } finally {
      running.current = false;
    }
  }
  function add(files: File[]) {
    setError("");
    if (items.current.size + files.length > 10) {
      setError("TOO_MANY_FILES");
      return;
    }
    for (const file of files) {
      if (file.size > 50 * 1024 * 1024) {
        setError("FILE_TOO_LARGE");
        continue;
      }
      if (!file.size) {
        setError("INVALID_UPLOAD");
        continue;
      }
      const id = crypto.randomUUID();
      items.current.set(id, {
        file,
        job: { id, name: file.name, progress: 0, status: "queued" },
      });
    }
    publish();
    void pump();
  }
  function cancel(id: string) {
    const item = items.current.get(id);
    items.current.delete(id);
    item?.cancel?.();
    publish();
  }
  function retry(id: string) {
    const item = items.current.get(id);
    if (!item || item.job.status !== "failed") return;
    item.job.status = "queued";
    item.job.progress = 0;
    item.job.error = undefined;
    publish();
    void pump();
  }
  useEffect(() => {
    alive.current = true;
    const active = items.current;
    const warn = (event: BeforeUnloadEvent) => {
      if ([...active.values()].some((item) => item.job.status !== "failed")) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", warn);
    return () => {
      alive.current = false;
      for (const item of active.values()) item.cancel?.();
      active.clear();
      window.removeEventListener("beforeunload", warn);
    };
  }, []);
  return (
    <UploadContext.Provider
      value={{
        jobs,
        choose: () => input.current?.click(),
        add,
        retry,
        cancel,
        error,
        clearError: () => setError(""),
      }}
    >
      <input
        ref={input}
        type="file"
        multiple
        className="hidden"
        tabIndex={-1}
        aria-label={t("choose")}
        onChange={(event) => {
          add(Array.from(event.target.files || []));
          event.target.value = "";
        }}
      />
      {children}
    </UploadContext.Provider>
  );
}
