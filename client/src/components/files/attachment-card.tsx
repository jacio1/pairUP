"use client";
import { useState } from "react";
import { Download, FileText, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocale, useTranslations } from "next-intl";
import { type Attachment, fileUrl, fileSize } from "@/lib/attachments";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
export function AttachmentCard({
  file,
  compact = false,
}: {
  file: Attachment;
  compact?: boolean;
}) {
  const t = useTranslations("Files"),
    locale = useLocale(),
    [open, setOpen] = useState(false),
    [failed, setFailed] = useState(false);
  return (
    <div className="min-w-0 space-y-2">
      {file.kind === "image" && !failed && (
        <button
          type="button"
          className={`block w-full overflow-hidden rounded-lg bg-black/10 outline-none focus-visible:ring-2 focus-visible:ring-ring ${compact ? "h-40" : "aspect-[4/3] max-h-80"}`}
          onClick={() => setOpen(true)}
          aria-label={t("viewImage", { name: file.name })}
        >
          {/* Private media must be fetched by the browser with its session cookie. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={fileUrl(file)}
            alt={file.name}
            loading="lazy"
            onError={() => setFailed(true)}
            className="size-full object-contain"
          />
        </button>
      )}
      {file.kind === "video" && !failed && (
        <video
          controls
          playsInline
          preload="metadata"
          src={fileUrl(file)}
          aria-label={file.name}
          onError={() => setFailed(true)}
          className={`aspect-video w-full rounded-lg bg-black object-contain ${compact ? "max-h-40" : "max-h-80"}`}
        />
      )}
      {failed && (
        <p className="text-xs leading-5">
          {t(file.kind === "video" ? "videoUnavailable" : "previewUnavailable")}
        </p>
      )}
      <div className="flex min-w-0 items-center gap-3 rounded-lg border border-current/15 p-3">
        <FileText className="size-5 shrink-0 opacity-80" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium" title={file.name}>
            {file.name}
          </p>
          <p className="mt-0.5 text-xs">{fileSize(file.size, locale)}</p>
        </div>
        <a
          href={fileUrl(file, true)}
          download
          className="flex size-9 shrink-0 items-center justify-center rounded-lg outline-none hover:bg-current/10 focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={t("download", { name: file.name })}
        >
          <Download className="size-4" />
        </a>
      </div>
      {file.kind === "image" && (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent
            showCloseButton={false}
            className="max-h-[92dvh] overflow-auto sm:max-w-5xl"
          >
            <div className="flex items-center justify-between gap-3">
              <DialogTitle className="min-w-0 text-sm wrap-anywhere">
                {file.name}
              </DialogTitle>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={t("dismiss")}
                onClick={() => setOpen(false)}
              >
                <X className="size-4" />
              </Button>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={open ? fileUrl(file) : undefined}
              alt={file.name}
              className="max-h-[72dvh] w-full object-contain"
            />
            <a
              href={fileUrl(file, true)}
              download
              className="text-sm text-primary underline"
            >
              {t("download", { name: file.name })}
            </a>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
