"use client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Check, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
export function TasksPreview() {
  const t = useTranslations("Room");
  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm font-medium">{t("sessionGoal")}</span>
          <Badge variant="secondary">2 / 4</Badge>
        </div>
        <p className="mb-4 text-xs leading-5 text-muted-foreground">
          {t("tasksGoal")}
        </p>
        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
          <div className="h-full w-1/2 rounded-full bg-primary" />
        </div>
      </div>
      <div className="space-y-2">
        {["taskOne", "taskTwo", "taskThree", "taskFour"].map((key, index) => (
          <div
            key={key}
            className="flex items-start gap-3 rounded-xl border border-border bg-card p-4"
          >
            <Checkbox
              checked={index < 2}
              disabled
              aria-label={t(key)}
              className="mt-0.5 disabled:opacity-100"
            />
            <div className="flex-1">
              <p
                className={`text-sm leading-5 ${index < 2 ? "text-muted-foreground line-through" : ""}`}
              >
                {t(key)}
              </p>
              <span className="mt-2 block text-[10px] text-muted-foreground">
                {t(index % 2 ? "together" : "host")}
              </span>
            </div>
            {index < 2 && <Check className="size-3.5 text-emerald-500" />}
          </div>
        ))}
      </div>
      <Button variant="outline" disabled className="w-full border-dashed">
        <Plus className="size-4" />
        {t("addTask")}
      </Button>
    </div>
  );
}
