"use client";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Check, Pencil, Trash2, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import {
  studyError,
  type StudyTask,
  useUpdateTaskMutation,
  useDeleteTaskMutation,
} from "@/lib/study-tools-api";
import { ToolFeedback } from "./tool-feedback";
import { ToolDeleteDialog } from "./tool-delete-dialog";

export function TaskRow({ task }: { task: StudyTask }) {
  const t = useTranslations("StudyTools");
  const [update, { isLoading: updating }] = useUpdateTaskMutation();
  const [remove, { isLoading: deleting }] = useDeleteTaskMutation();
  const [draft, setDraft] = useState<{ title: string; version: number } | null>(
    null,
  );
  const [confirm, setConfirm] = useState(false),
    [error, setError] = useState("");
  const busy = updating || deleting;
  async function change(
    body: { title?: string; completed?: boolean },
    version = task.version,
  ) {
    setError("");
    try {
      await update({
        roomId: task.roomId,
        id: task.id,
        version,
        ...body,
      }).unwrap();
      setDraft(null);
    } catch (cause) {
      setError(studyError(cause));
    }
  }
  async function destroy() {
    try {
      await remove({
        roomId: task.roomId,
        id: task.id,
        version: task.version,
      }).unwrap();
      setConfirm(false);
    } catch (cause) {
      setError(studyError(cause));
      setConfirm(false);
    }
  }
  return (
    <li className="space-y-2 rounded-xl border bg-card p-3">
      <div className="flex items-start gap-2.5">
        <Checkbox
          checked={task.completed}
          disabled={busy || !!draft}
          onCheckedChange={(checked) =>
            void change({ completed: checked === true })
          }
          aria-label={task.title}
          className="mt-1 shrink-0"
        />
        {draft ? (
          <form
            className="min-w-0 flex-1 space-y-2"
            onSubmit={(event) => {
              event.preventDefault();
              void change({ title: draft.title }, draft.version);
            }}
          >
            <Input
              autoFocus
              aria-label={t("taskTitle")}
              value={draft.title}
              maxLength={300}
              onChange={(event) =>
                setDraft({ ...draft, title: event.target.value })
              }
              disabled={busy}
              onKeyDown={(event) => {
                if (event.key === "Escape") setDraft(null);
              }}
            />
            <div className="flex justify-end gap-1">
              <Button
                size="icon-sm"
                type="button"
                variant="ghost"
                disabled={busy}
                aria-label={t("cancel")}
                onClick={() => {
                  setDraft(null);
                  setError("");
                }}
              >
                <X className="size-4" />
              </Button>
              <Button
                size="icon-sm"
                type="submit"
                variant="secondary"
                disabled={
                  busy || !draft.title.trim() || error === "TOOL_CONFLICT"
                }
                aria-label={t("saveTask")}
              >
                <Check className="size-4" />
              </Button>
            </div>
          </form>
        ) : (
          <>
            <p
              className={`min-w-0 flex-1 text-sm leading-6 wrap-anywhere ${task.completed ? "text-muted-foreground line-through" : ""}`}
            >
              {task.title}
            </p>
            <div className="flex shrink-0 gap-0.5">
              <Button
                size="icon-sm"
                variant="ghost"
                aria-label={t("editTask")}
                disabled={busy}
                onClick={() => {
                  setError("");
                  setDraft({ title: task.title, version: task.version });
                }}
              >
                <Pencil className="size-3.5" />
              </Button>
              <Button
                size="icon-sm"
                variant="ghost"
                aria-label={t("deleteTask")}
                disabled={busy}
                onClick={() => setConfirm(true)}
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          </>
        )}
      </div>
      <ToolFeedback error={error} />
      {error === "TOOL_CONFLICT" && draft && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setDraft({ title: task.title, version: task.version });
            setError("");
          }}
        >
          {t("reloadTask")}
        </Button>
      )}
      <ToolDeleteDialog
        open={confirm}
        onOpenChange={setConfirm}
        title={t("deleteTask")}
        description={t("deleteTaskHint")}
        busy={deleting}
        onConfirm={() => void destroy()}
      />
    </li>
  );
}
