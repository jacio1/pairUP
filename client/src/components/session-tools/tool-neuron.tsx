"use client";

import type { ChatActions } from "@/components/chat/use-chat-actions";
import { NeuronMascot } from "@/components/neuron-mascot";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { errorCode } from "@/lib/errors";
import { useTranslations } from "next-intl";
import { useId, useState, type SubmitEvent } from "react";
import { ToolFeedback } from "./tool-feedback";

export function ToolNeuron({
  chat,
  tool,
  noteId,
  openChat,
}: {
  chat: ChatActions;
  tool: "notes" | "tasks" | "pomodoro";
  noteId?: string;
  openChat: () => void;
}) {
  const t = useTranslations("StudyTools");
  const id = useId();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const [jobId, setJobId] = useState<string>();
  const ownJob = chat.ai?.id === jobId ? chat.ai : null;
  if (!chat.canAskNeuron) return null;

  async function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    try {
      const job = await chat.askNeuron(draft.trim(), { tool, noteId });
      if (job) {
        setJobId(job.id);
        setDraft("");
      }
    } catch (cause) {
      setError(errorCode(cause));
    }
  }

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="outline"
        className="w-full"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen(!open)}
      >
        <NeuronMascot icon decorative className="size-5" />
        {t("askNeuron")}
      </Button>
      <div id={id} hidden={!open}>
        <form aria-labelledby={`${id}-label`} className="space-y-2 rounded-xl border bg-card p-3" onSubmit={submit}>
          <Label id={`${id}-label`} htmlFor={`${id}-prompt`}>
            {t(tool === "notes" && noteId ? "neuronSelectedNote" : "neuronPrompt")}
          </Label>
          <textarea
            id={`${id}-prompt`}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            rows={3}
            required
            maxLength={2000}
            className="w-full rounded-lg border border-input bg-background p-2 text-base focus-visible:outline-2 focus-visible:outline-ring sm:text-sm"
            placeholder={t(tool === "notes" ? "neuronNoteExample" : tool === "tasks" ? "neuronTaskExample" : "neuronTimerExample")}
          />
          <Button type="submit" size="sm" disabled={!chat.connected || chat.asking || chat.busy || !draft.trim()}>
            {t("sendNeuron")}
          </Button>
          <ToolFeedback error={error || ownJob?.error || undefined} />
          {jobId && (
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span role="status">
                {t(ownJob?.status === "running" || ownJob?.status === "pending" ? "neuronWorking" : "neuronChatStatus")}
              </span>
              <Button type="button" variant="ghost" size="sm" onClick={openChat}>
                {t("openChat")}
              </Button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
