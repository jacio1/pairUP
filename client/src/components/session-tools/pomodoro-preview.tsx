"use client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pause, RotateCcw } from "lucide-react";
import { useTranslations } from "next-intl";
export function PomodoroPreview() {
  const t = useTranslations("Room");
  return (
    <div className="space-y-6">
      <div className="flex justify-center gap-2">
        <Badge className="px-3 py-1">{t("focus")}</Badge>
        <Badge variant="outline" className="px-3 py-1">
          {t("shortBreak")}
        </Badge>
      </div>
      <div className="relative mx-auto flex size-60 items-center justify-center">
        <svg
          className="absolute inset-0 -rotate-90"
          viewBox="0 0 240 240"
          aria-hidden="true"
        >
          <circle
            cx="120"
            cy="120"
            r="108"
            fill="none"
            stroke="currentColor"
            strokeWidth="6"
            className="text-muted"
          />
          <circle
            cx="120"
            cy="120"
            r="108"
            fill="none"
            stroke="currentColor"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray="679"
            strokeDashoffset="95"
            className="text-primary"
          />
        </svg>
        <div className="text-center">
          <p className="text-[48px] font-light tracking-tight tabular-nums">
            24:32
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            {t("focusSession")} 1 / 4
          </p>
        </div>
      </div>
      <p className="text-center text-xs leading-5 text-muted-foreground">
        {t("timerShared")}
      </p>
      <div className="flex justify-center gap-3">
        <Button
          size="icon"
          variant="outline"
          disabled
          aria-label={t("resetTimer")}
        >
          <RotateCcw className="size-4" />
        </Button>
        <Button disabled className="px-7">
          <Pause className="size-4" />
          {t("pause")}
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-3 rounded-xl border border-border bg-card p-4">
        <div className="space-y-2">
          <Label htmlFor="focus-minutes" className="text-xs">
            {t("focusMinutes")}
          </Label>
          <Input
            id="focus-minutes"
            readOnly
            value="25"
            className="bg-background"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="break-minutes" className="text-xs">
            {t("breakMinutes")}
          </Label>
          <Input
            id="break-minutes"
            readOnly
            value="5"
            className="bg-background"
          />
        </div>
      </div>
    </div>
  );
}
