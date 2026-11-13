"use client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ListChecks, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRef, useState } from "react";
import {
  studyError,
  useCreateTaskMutation,
  useStudyToolsQuery,
} from "@/lib/study-tools-api";
import { TaskRow } from "./task-row";
import { ToolFeedback } from "./tool-feedback";
export function TasksPanel({ roomId }: { roomId: string }) {
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
  const [create, { isLoading: creating }] = useCreateTaskMutation();
  const [title, setTitle] = useState(""),
    [error, setError] = useState("");
  const pending = useRef<{ id: string; title: string } | null>(null);
  const completed = data?.tasks.filter((task) => task.completed).length || 0,
    count = data?.tasks.length || 0;
  async function add() {
    const value = title.trim();
    if (!value || creating) return;
    setError("");
    if (pending.current?.title !== value)
      pending.current = { id: crypto.randomUUID(), title: value };
    try {
      await create({ roomId, ...pending.current }).unwrap();
      pending.current = null;
      setTitle((current) => (current.trim() === value ? "" : current));
    } catch (cause) {
      setError(studyError(cause));
    }
  }
  return (
    <div className="space-y-4">
      <div className="rounded-xl border bg-card p-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h3 className="text-sm font-medium">{t("progress")}</h3>
          <Badge variant="secondary">
            {completed} / {count}
          </Badge>
        </div>
        <div
          role="progressbar"
          aria-label={t("progress")}
          aria-valuemin={0}
          aria-valuemax={Math.max(count, 1)}
          aria-valuenow={completed}
          className="h-2 overflow-hidden rounded-full bg-muted"
        >
          <div
            className="h-full rounded-full bg-primary transition-[width]"
            style={{ width: `${count ? (completed / count) * 100 : 0}%` }}
          />
        </div>
      </div>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void add();
        }}
        className="space-y-2"
      >
        <Label htmlFor="new-task-title">{t("newTask")}</Label>
        <div className="flex gap-2">
          <Input
            id="new-task-title"
            value={title}
            maxLength={300}
            placeholder={t("taskPlaceholder")}
            onChange={(event) => setTitle(event.target.value)}
          />
          <Button
            type="submit"
            disabled={creating || !title.trim() || isLoading}
            size="icon"
            aria-label={t("addTask")}
          >
            <Plus className="size-4" />
          </Button>
        </div>
      </form>
      <ToolFeedback
        error={error || (loadError ? studyError(loadError) : "")}
        retry={() => void refetch()}
      />
      {isLoading && (
        <p role="status" className="text-sm text-muted-foreground">
          {t("loading")}
        </p>
      )}
      {!isLoading && data?.tasks.length === 0 && (
        <div className="rounded-xl border border-dashed p-6 text-center">
          <ListChecks className="mx-auto mb-3 size-7 text-primary" />
          <h3 className="text-sm font-medium">{t("noTasks")}</h3>
          <p className="mt-2 text-xs leading-5 text-muted-foreground">
            {t("tasksHint")}
          </p>
        </div>
      )}
      {!!data?.tasks.length && (
        <ul aria-label={t("tasksList")} className="space-y-2">
          {data.tasks.map((task) => (
            <TaskRow key={task.id} task={task} />
          ))}
        </ul>
      )}
    </div>
  );
}
