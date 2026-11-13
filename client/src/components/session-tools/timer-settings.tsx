"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Timer, TimerChange } from "@/lib/room-activities-api";
export function TimerSettings({
  timer,
  disabled,
  change,
}: {
  timer: Timer;
  disabled: boolean;
  change: (input: TimerChange) => Promise<boolean>;
}) {
  const t = useTranslations("Activities");
  const [values, setValues] = useState(
    [
      timer.focusSeconds / 60,
      timer.breakSeconds / 60,
      timer.longBreakSeconds / 60,
    ].map(String),
  );
  const valid = values.every(
    (v) => Number.isInteger(Number(v)) && Number(v) >= 1 && Number(v) <= 120,
  );
  return (
    <form
      className="space-y-4 rounded-xl border bg-card p-4"
      onSubmit={async (e) => {
        e.preventDefault();
        if (valid)
          await change({
            action: "configure",
            focusSeconds: Number(values[0]) * 60,
            breakSeconds: Number(values[1]) * 60,
            longBreakSeconds: Number(values[2]) * 60,
          });
      }}
    >
      <div className="grid grid-cols-3 gap-3">
        {(["focusMinutes", "breakMinutes", "longBreakMinutes"] as const).map(
          (key, i) => (
            <div key={key} className="space-y-2">
              <Label htmlFor={`timer-${key}`} className="text-xs leading-5">
                {t(key)}
              </Label>
              <Input
                id={`timer-${key}`}
                type="number"
                min={1}
                max={120}
                step={1}
                value={values[i]}
                onChange={(e) =>
                  setValues((current) =>
                    current.map((v, j) => (j === i ? e.target.value : v)),
                  )
                }
                disabled={disabled}
              />
            </div>
          ),
        )}
      </div>
      <Button
        type="submit"
        variant="outline"
        className="w-full"
        disabled={disabled || !valid}
      >
        {t("apply")}
      </Button>
      <p className="text-xs leading-5 text-muted-foreground">
        {t("settingsHint")}
      </p>
    </form>
  );
}
