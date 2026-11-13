"use client";
import { Button } from "@/components/ui/button";
import { useAppDispatch } from "@/lib/hooks";
import { actions } from "@/lib/store";
import { X } from "lucide-react";
import { NeuronMascot } from "@/components/neuron-mascot";
import { useTranslations } from "next-intl";
import type { ChatActions } from "./use-chat-actions";
export function NeuronContext({ chat }: { chat: Pick<ChatActions, "target"> }) {
  const t = useTranslations("Demo");
  const dispatch = useAppDispatch();
  const { target } = chat;
  return (
    <div className="mb-2 flex items-center gap-2 rounded-lg bg-primary/5 px-3 py-2">
      <NeuronMascot icon decorative className="size-7" />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium">
          {t(target ? "selectedMessage" : "recentConversation")}
        </p>
        {target && (
          <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
            {target.text.slice(0, 100)}
          </p>
        )}
      </div>
      <Button
        variant="ghost"
        size="icon-xs"
        onClick={() => dispatch(actions.mode({ enabled: false }))}
        aria-label={t("cancelNeuron")}
      >
        <X className="size-3.5" />
      </Button>
    </div>
  );
}
