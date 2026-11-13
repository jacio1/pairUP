"use client";
import { useRef, useState } from "react";
import { UploadCloud } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRoomUploads } from "./upload-provider";
export function FileDropZone({
  children,
  className,
  label,
}: {
  children: React.ReactNode;
  className?: string;
  label?: string;
}) {
  const { add } = useRoomUploads(),
    t = useTranslations("Files"),
    depth = useRef(0),
    [over, setOver] = useState(false);
  return (
    <section
      className={`relative ${className || ""}`}
      aria-label={label}
      onDragEnter={(event) => {
        if (event.dataTransfer.types.includes("Files")) {
          event.preventDefault();
          depth.current++;
          setOver(true);
        }
      }}
      onDragOver={(event) => {
        if (event.dataTransfer.types.includes("Files")) {
          event.preventDefault();
          event.dataTransfer.dropEffect = "copy";
        }
      }}
      onDragLeave={() => {
        depth.current = Math.max(0, depth.current - 1);
        if (!depth.current) setOver(false);
      }}
      onDrop={(event) => {
        if (!event.dataTransfer.types.includes("Files")) return;
        event.preventDefault();
        depth.current = 0;
        setOver(false);
        add(Array.from(event.dataTransfer.files));
      }}
    >
      {children}
      {over && (
        <div className="pointer-events-none absolute inset-1 z-30 flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-primary bg-card/95 p-5 text-center text-sm font-medium">
          <UploadCloud className="size-8 text-primary" />
          {t("drop")}
        </div>
      )}
    </section>
  );
}
