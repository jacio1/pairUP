"use client";
import { Button } from "@/components/ui/button";
import { StickyNote, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRef, useState } from "react";
import {
  studyError,
  useCreateNoteMutation,
  useStudyToolsQuery,
} from "@/lib/study-tools-api";
import { NoteEditor } from "./note-editor";
import { ToolFeedback } from "./tool-feedback";
export function NotesPanel({ roomId }: { roomId: string }) {
  const t = useTranslations("StudyTools");
  const {
    data,
    isLoading,
    error: loadError,
    refetch,
  } = useStudyToolsQuery(roomId, {
    pollingInterval: 15000,
    refetchOnMountOrArgChange: true,
  });
  const [create, { isLoading: creating }] = useCreateNoteMutation();
  const [selected, setSelected] = useState<string | null>(null),
    [error, setError] = useState("");
  const pending = useRef<string | null>(null);
  const active =
    data?.notes.find((n) => n.id === selected)?.id || data?.notes[0]?.id;
  async function add() {
    setError("");
    pending.current ||= crypto.randomUUID();
    try {
      const note = await create({ roomId, id: pending.current }).unwrap();
      pending.current = null;
      setSelected(note.id);
    } catch (cause) {
      setError(studyError(cause));
    }
  }
  return (
    <div className="space-y-4">
      <Button
        variant="outline"
        className="w-full"
        disabled={creating || isLoading}
        onClick={() => void add()}
      >
        <Plus className="size-4" />
        {t("newNote")}
      </Button>
      <ToolFeedback
        error={error || (loadError ? studyError(loadError) : "")}
        retry={() => void refetch()}
      />
      {isLoading && (
        <p role="status" className="text-sm text-muted-foreground">
          {t("loading")}
        </p>
      )}
      {!isLoading && data?.notes.length === 0 && (
        <div className="rounded-xl border border-dashed p-6 text-center">
          <StickyNote className="mx-auto mb-3 size-7 text-primary" />
          <h3 className="text-sm font-medium">{t("noNotes")}</h3>
          <p className="mt-2 text-xs leading-5 text-muted-foreground">
            {t("notesHint")}
          </p>
        </div>
      )}
      {!!data?.notes.length && (
        <nav
          aria-label={t("notesList")}
          className="flex max-h-36 flex-wrap gap-2 overflow-y-auto"
        >
          {data.notes.map((note) => (
            <Button
              key={note.id}
              size="sm"
              variant={active === note.id ? "secondary" : "outline"}
              aria-pressed={active === note.id}
              onClick={() => setSelected(note.id)}
              className="max-w-full"
            >
              <StickyNote className="size-3.5 shrink-0" />
              <span className="truncate">{note.title || t("untitled")}</span>
            </Button>
          ))}
        </nav>
      )}
      {active && (
        <NoteEditor
          key={active}
          roomId={roomId}
          id={active}
          onDeleted={() => setSelected(null)}
        />
      )}
    </div>
  );
}
