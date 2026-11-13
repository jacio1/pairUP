"use client";
import { useState } from "react";
import { useRoomFilesQuery } from "@/lib/files-api";
import { Button } from "@/components/ui/button";
import { UploadCloud } from "lucide-react";
import { useTranslations, useFormatter } from "next-intl";
import { useRoomUploads } from "./upload-provider";
import { UploadProgress } from "./upload-progress";
import { FileDropZone } from "./file-drop-zone";
import { AttachmentCard } from "./attachment-card";
export function FilesPanel({ roomId }: { roomId: string }) {
  const [gallery, setGallery] = useState(false);
  const t = useTranslations("Files"),
    format = useFormatter(),
    { choose } = useRoomUploads();
  const {
    data = [],
    isLoading,
    isError,
    refetch,
  } = useRoomFilesQuery(roomId, {
    pollingInterval: 15000,
    refetchOnMountOrArgChange: 30,
  });
  return (
    <FileDropZone className="space-y-4">
      <div className="rounded-xl border border-dashed border-primary/40 bg-card p-5 text-center">
        <UploadCloud className="mx-auto mb-3 size-7 text-primary" />
        <h3 className="text-sm font-medium">{t("drop")}</h3>
        <p className="mt-2 text-xs leading-6 text-muted-foreground">
          {t("limits")}
        </p>
        <Button className="mt-4" variant="outline" onClick={choose}>
          {t("choose")}
        </Button>
      </div>
      <UploadProgress />
      <div
        className="flex gap-2 rounded-xl bg-muted p-1"
        role="group"
        aria-label={t("sharedFiles")}
      >
        {([false, true] as const).map((value) => (
          <Button
            key={String(value)}
            variant={gallery === value ? "secondary" : "ghost"}
            className="flex-1"
            aria-pressed={gallery === value}
            onClick={() => setGallery(value)}
          >
            {t(value ? "gallery" : "documents")} ·{" "}
            {data.filter((f) => (f.kind !== "file") === value).length}
          </Button>
        ))}
      </div>
      {isLoading && (
        <p role="status" className="text-sm text-muted-foreground">
          {t("loading")}
        </p>
      )}
      {isError && (
        <p role="alert" className="text-xs text-destructive">
          {t("loadError")}{" "}
          <Button variant="ghost" size="sm" onClick={() => void refetch()}>
            {t("retry")}
          </Button>
        </p>
      )}
      {!isLoading &&
        !isError &&
        !data.filter((f) => (f.kind !== "file") === gallery).length && (
          <p className="py-4 text-center text-sm text-muted-foreground">
            {t("empty")}
          </p>
        )}
      {!!data.filter((f) => (f.kind !== "file") === gallery).length && (
        <ul
          aria-label={t("sharedFiles")}
          className={gallery ? "grid grid-cols-2 gap-3" : "space-y-3"}
        >
          {data
            .filter((f) => (f.kind !== "file") === gallery)
            .map((file) => (
              <li key={file.id} className="rounded-xl border bg-card p-3">
                <AttachmentCard file={file} compact />
                <p className="mt-2 flex flex-wrap justify-between gap-1 text-[11px] text-muted-foreground">
                  <span>{file.author}</span>
                  <time dateTime={file.createdAt}>
                    {format.dateTime(new Date(file.createdAt), {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </time>
                </p>
              </li>
            ))}
        </ul>
      )}
    </FileDropZone>
  );
}
