"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Download, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { studyError, useDeleteNoteMutation } from "@/lib/study-tools-api";
import { ToolFeedback } from "./tool-feedback";
import { useNoteEditor } from "./use-note-editor";
import { ToolDeleteDialog } from "./tool-delete-dialog";

export function NoteEditor({
  roomId,
  id,
  onDeleted,
}: {
  roomId: string;
  id: string;
  onDeleted: () => void;
}) {
  const t = useTranslations("StudyTools");
  const note = useNoteEditor(roomId, id);
  const [remove, { isLoading: deleting }] = useDeleteNoteMutation();
  const [confirm, setConfirm] = useState(false),
    [error, setError] = useState("");
  async function destroy() {
    try {
      await remove({ roomId, id, version: note.version! }).unwrap();
      setConfirm(false);
      onDeleted();
    } catch (cause) {
      setError(studyError(cause));
      setConfirm(false);
    }
  }
  function download() {
    const url = URL.createObjectURL(
      new Blob([`${note.value.title}\n\n${note.value.body}`], {
        type: "text/plain;charset=utf-8",
      }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = `${(note.value.title || t("untitled")).replace(/[<>:"/\\|?*\u0000-\u001f]/g, "_").slice(0, 80)}.txt`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return (
    <div className="space-y-3 rounded-xl border bg-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span role="status" className="text-xs text-muted-foreground">
          {t(note.loading ? "loading" : note.status)}
        </span>
        <div className="flex gap-1">
          <Button
            size="icon-sm"
            variant="ghost"
            aria-label={t("exportNote")}
            onClick={download}
          >
            <Download className="size-4" />
          </Button>
          <Button
            size="icon-sm"
            variant="ghost"
            aria-label={t("deleteNote")}
            disabled={note.dirty || note.version === undefined || deleting}
            onClick={() => setConfirm(true)}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>
      <Label htmlFor={`note-title-${id}`}>{t("noteTitle")}</Label>
      <Input
        id={`note-title-${id}`}
        value={note.value.title}
        maxLength={120}
        placeholder={t("untitled")}
        disabled={note.loading || deleting}
        onChange={(e) => note.change("title", e.target.value)}
      />
      <Label htmlFor={`note-body-${id}`}>{t("noteBody")}</Label>
      <textarea
        id={`note-body-${id}`}
        value={note.value.body}
        maxLength={20000}
        placeholder={t("notePlaceholder")}
        disabled={note.loading || deleting}
        onChange={(e) => note.change("body", e.target.value)}
        className="min-h-72 w-full resize-none rounded-lg border border-input bg-background/40 p-3 text-sm leading-7 outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40 disabled:opacity-50"
      />
      <p className="text-[11px] leading-5 text-muted-foreground">
        {t("autoSaveHint")}
      </p>
      <ToolFeedback error={error || note.error} retry={note.retry} />
      <ToolDeleteDialog
        open={confirm}
        onOpenChange={setConfirm}
        title={t("deleteNote")}
        description={t("deleteNoteHint")}
        busy={deleting}
        onConfirm={() => void destroy()}
      />
    </div>
  );
}
