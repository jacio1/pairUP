"use client";
import { useRoomFilesQuery } from "@/lib/files-api";
import { Button } from "@/components/ui/button";
import { UploadCloud } from "lucide-react";
import { useTranslations, useFormatter } from "next-intl";
import { useRoomUploads } from "./upload-provider";
import { UploadProgress } from "./upload-progress";
import { FileDropZone } from "./file-drop-zone";
import { AttachmentCard } from "./attachment-card";
export function FilesPanel({ roomId }: { roomId: string }) {
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
    refetchOnMountOrArgChange: true,
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
      {!isLoading && !isError && !data.length && (
        <p className="py-4 text-center text-sm text-muted-foreground">
          {t("empty")}
        </p>
      )}
      {!!data.length && (
        <ul aria-label={t("sharedFiles")} className="space-y-3">
          {data.map((file) => (
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
