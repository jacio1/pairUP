"use client";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
export function ToolFeedback({
  error,
  retry,
}: {
  error?: string;
  retry?: () => void;
}) {
  const t = useTranslations("StudyTools");
  if (!error) return null;
  return (
    <div
      role="alert"
      className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-xs leading-5 text-destructive"
    >
      {t(t.has(error) ? error : "SERVER_ERROR")}
      {retry && (
        <Button size="sm" variant="ghost" onClick={retry} className="ml-1">
          {t("retry")}
        </Button>
      )}
    </div>
  );
}
