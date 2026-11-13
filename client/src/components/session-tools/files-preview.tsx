"use client";
import { Button } from "@/components/ui/button";
import {
  ArrowDownToLine,
  FileImage,
  FileText,
  ImagePlus,
  UploadCloud,
} from "lucide-react";
import { useTranslations } from "next-intl";
export function FilesPreview() {
  const t = useTranslations("Room");
  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-dashed border-primary/30 bg-primary/4 px-5 py-7 text-center">
        <UploadCloud className="mx-auto mb-3 size-7 text-primary" />
        <p className="text-sm font-medium">{t("dropFiles")}</p>
        <p className="mt-2 text-xs leading-5 text-muted-foreground">
          {t("fileTypes")}
        </p>
        <Button variant="outline" size="sm" disabled className="mt-4">
          <ImagePlus className="size-3.5" />
          {t("selectFiles")}
        </Button>
      </div>
      <div>
        <h3 className="mb-3 flex items-center justify-between text-xs font-medium">
          {t("sharedFiles")}
          <span className="text-muted-foreground">3</span>
        </h3>
        <div className="space-y-2">
          {[
            {
              name: "English — Unit 04.pdf",
              size: "1.4 MB",
              icon: FileText,
              color: "text-rose-500 bg-rose-500/8",
            },
            {
              name: "Vocabulary cards.png",
              size: "820 KB",
              icon: FileImage,
              color: "text-blue-500 bg-blue-500/8",
            },
            {
              name: "Practice exercises.docx",
              size: "248 KB",
              icon: FileText,
              color: "text-violet-500 bg-violet-500/8",
            },
          ].map(({ name, size, icon: Icon, color }) => (
            <div
              key={name}
              className="flex items-center gap-3 rounded-xl border border-border bg-card p-3"
            >
              <span
                className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${color}`}
              >
                <Icon className="size-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium">{name}</p>
                <p className="mt-1 text-[10px] text-muted-foreground">
                  {size} · {t("host")}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                disabled
                aria-label={`${t("download")} ${name}`}
              >
                <ArrowDownToLine className="size-3.5" />
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
