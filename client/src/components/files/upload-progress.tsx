"use client";
import { Button } from "@/components/ui/button";
import { RotateCcw, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRoomUploads } from "./upload-provider";
export function UploadProgress() {
  const { jobs, retry, cancel, error, clearError } = useRoomUploads(),
    t = useTranslations("Files");
  if (!jobs.length && !error) return null;
  return (
    <div className="mb-3 space-y-2">
      {error && (
        <div
          role="alert"
          className="flex items-center justify-between gap-2 rounded-lg bg-destructive/10 p-2 text-xs text-destructive"
        >
          {t(t.has(error) ? error : "UPLOAD_FAILED")}
          <Button
            size="icon-xs"
            variant="ghost"
            aria-label={t("dismiss")}
            onClick={clearError}
          >
            <X className="size-3" />
          </Button>
        </div>
      )}
      {jobs.map((job) => (
        <div key={job.id} className="rounded-lg border bg-background p-2">
          <div className="flex items-center gap-2">
            <span className="min-w-0 flex-1 truncate text-xs">{job.name}</span>
            <span className="text-[11px] text-muted-foreground">
              {t(job.status)}
              {job.status === "uploading" ? ` ${job.progress}%` : ""}
            </span>
            {job.status === "failed" && (
              <Button
                size="icon-xs"
                variant="ghost"
                onClick={() => retry(job.id)}
                aria-label={t("retry")}
              >
                <RotateCcw className="size-3" />
              </Button>
            )}
            <Button
              size="icon-xs"
              variant="ghost"
              onClick={() => cancel(job.id)}
              aria-label={t("cancel")}
            >
              <X className="size-3" />
            </Button>
          </div>
          {job.status === "uploading" && (
            <div
              role="progressbar"
              aria-label={job.name}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={job.progress}
              className="mt-2 h-1 overflow-hidden rounded bg-muted"
            >
              <div
                className="h-full bg-primary"
                style={{ width: `${job.progress}%` }}
              />
            </div>
          )}
          {job.error && (
            <p role="alert" className="mt-1 text-xs text-destructive">
              {t(t.has(job.error) ? job.error : "UPLOAD_FAILED")}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
