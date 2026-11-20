"use client";
import { Download, Paperclip, X } from "lucide-react";
import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import type { SocialMedia } from "@/lib/social-api";

const contentUrl = (file: SocialMedia) =>
  `/api/social/media/${file.id}/content`;

export function SocialMediaGallery({ files }: { files: SocialMedia[] }) {
  const t = useTranslations("Social");
  const dialog = useRef<HTMLDialogElement>(null);
  const [selected, setSelected] = useState<SocialMedia | null>(null);
  const visual = files.filter((file) => file.kind !== "file");
  const documents = files.filter((file) => file.kind === "file");
  return (
    <>
      {visual.length > 0 && (
        <div
          className={`grid gap-1 overflow-hidden rounded-xl bg-muted ${visual.length > 3 ? "grid-cols-3" : "grid-cols-2"}`}
        >
          {visual.map((file, index) =>
            file.kind === "video" ? (
              <video
                key={file.id}
                {...{ loading: "lazy" }}
                src={contentUrl(file)}
                preload="metadata"
                controls
                playsInline
                aria-label={file.name}
                className="col-span-full aspect-video w-full bg-neutral-950 object-contain"
              />
            ) : (
              <button
                key={file.id}
                type="button"
                aria-label={t("openMedia", { name: file.name })}
                className={`relative min-w-0 overflow-hidden bg-neutral-950 focus-visible:z-10 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary ${index === 0 && visual.length !== 2 ? "col-span-full aspect-video" : "aspect-[4/3]"}`}
                onClick={() => {
                  setSelected(file);
                  dialog.current?.showModal();
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={contentUrl(file)}
                  alt={file.name}
                  loading="lazy"
                  className={
                    "size-full " + (index ? "object-cover" : "object-contain")
                  }
                />
              </button>
            ),
          )}
        </div>
      )}
      {documents.length > 0 && (
        <ul className="space-y-2">
          {documents.map((file) => (
            <li key={file.id}>
              <a
                href={`${contentUrl(file)}?download=1`}
                className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2 text-sm hover:text-primary"
              >
                <Paperclip className="size-4 shrink-0" />
                <span className="min-w-0 flex-1 wrap-anywhere">
                  {file.name}
                </span>
                <Download className="size-4 shrink-0" aria-hidden="true" />
              </a>
            </li>
          ))}
        </ul>
      )}
      {visual.some((file) => file.kind === "image") && (
        <dialog
          ref={dialog}
          aria-label={selected?.name}
          onClose={() => setSelected(null)}
          className="m-auto max-h-[95dvh] w-[min(95vw,64rem)] rounded-xl border bg-card p-3 text-foreground backdrop:bg-black/80"
        >
          <div className="mb-2 flex items-center justify-between gap-3">
            <span className="min-w-0 truncate text-sm">{selected?.name}</span>
            <button
              type="button"
              className="rounded-md p-2 hover:bg-muted"
              aria-label={t("close")}
              onClick={() => dialog.current?.close()}
            >
              <X className="size-5" />
            </button>
          </div>
          {selected?.kind === "image" && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={contentUrl(selected)}
              alt={selected.name}
              className="mx-auto max-h-[78dvh] w-auto object-contain"
            />
          )}
        </dialog>
      )}
    </>
  );
}

export function AttachmentInput({
  files,
  onChange,
  remaining = 10,
}: {
  files: File[];
  onChange: (files: File[]) => void;
  remaining?: number;
}) {
  const t = useTranslations("Social");
  const [invalid, setInvalid] = useState(false);
  return (
    <div className="space-y-2 text-sm">
      <label className="flex w-fit cursor-pointer items-center gap-2 rounded-md border px-3 py-2 hover:bg-muted focus-within:outline-2 focus-within:outline-primary">
        <Paperclip className="size-4" aria-hidden="true" />
        {t("attach")}
        <input
          type="file"
          multiple
          className="sr-only"
          onChange={(event) => {
            const next = [...files, ...Array.from(event.target.files ?? [])];
            const invalid =
              next.length > remaining ||
              next.reduce((sum, file) => sum + file.size, 0) > 50 * 1024 * 1024;
            setInvalid(invalid);
            if (!invalid) onChange(next);
            event.target.value = "";
          }}
        />
      </label>
      {invalid && (
        <p role="alert" className="text-destructive">
          {t("uploadLimit", { count: remaining })}
        </p>
      )}
      {files.map((file, index) => (
        <button
          type="button"
          key={`${file.name}-${index}`}
          onClick={() => onChange(files.filter((_, i) => i !== index))}
          className="mr-2 inline-flex max-w-full items-center gap-2 rounded-md bg-muted px-2 py-1"
          aria-label={t("removeFile", { name: file.name })}
        >
          <span className="truncate">{file.name}</span>
          <X className="size-4 shrink-0" />
        </button>
      ))}
    </div>
  );
}
