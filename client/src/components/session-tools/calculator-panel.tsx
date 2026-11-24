"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Delete } from "lucide-react";
import { useTranslations } from "next-intl";
import { useId, useState } from "react";
import { calculate } from "./calculator";

const keys = ["(", ")", "clear", "backspace", "7", "8", "9", "÷", "4", "5", "6", "×", "1", "2", "3", "−", "0", ".", "=", "+"];

export function CalculatorPanel() {
  const t = useTranslations("Calculator");
  const id = useId();
  const [expression, setExpression] = useState("");
  const [result, setResult] = useState<string>();
  const [error, setError] = useState("");

  function press(key: string) {
    setError("");
    if (key === "clear") setExpression("");
    else if (key === "backspace") setExpression(expression.slice(0, -1));
    else if (result !== undefined && /^[+−×÷]$/.test(key))
      setExpression(result + key);
    else setExpression((result === undefined ? expression + key : key).slice(0, 160));
    setResult(undefined);
  }

  return (
    <form
      aria-label={t("label")}
      className="mx-auto max-w-sm space-y-4 rounded-xl border bg-card p-4"
      onSubmit={(event) => {
        event.preventDefault();
        try {
          setResult(String(calculate(expression)));
          setError("");
        } catch (cause) {
          setError(cause instanceof Error && cause.message === "DIVIDE_BY_ZERO" ? "zero" : "invalid");
          setResult(undefined);
        }
      }}
    >
      <div className="space-y-2 rounded-lg bg-background p-3">
        <Label htmlFor={id}>{t("expression")}</Label>
        <Input
          id={id}
          value={expression}
          maxLength={160}
          autoComplete="off"
          spellCheck={false}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          placeholder="(12 + 8) ÷ 4"
          className="text-right font-mono"
          onChange={(event) => {
            setExpression(event.target.value);
            setError("");
            setResult(undefined);
          }}
        />
        <output htmlFor={id} aria-label={t("result")} className="block min-h-9 break-all text-right font-mono text-2xl tabular-nums">
          {result}
        </output>
        {error && <p id={`${id}-error`} role="alert" className="text-sm text-destructive">{t(error)}</p>}
      </div>
      <div className="grid grid-cols-4 gap-2">
        {keys.map((key) => (
          <Button
            key={key}
            type={key === "=" ? "submit" : "button"}
            variant={key === "=" ? "default" : /^[0-9.]$/.test(key) ? "outline" : "secondary"}
            className="h-11 min-w-0 px-0 font-mono text-base"
            aria-label={key === "clear" || key === "backspace" ? t(key) : key === "=" ? t("calculate") : undefined}
            onClick={key === "=" ? undefined : () => press(key)}
          >
            {key === "clear" ? "C" : key === "backspace" ? <Delete aria-hidden="true" /> : key}
          </Button>
        ))}
      </div>
    </form>
  );
}
