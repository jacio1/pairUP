"use client";
import { Label } from "@/components/ui/label";
import { useTranslations } from "next-intl";
import { type ReactNode } from "react";
export function FormField({
  id,
  label,
  hint,
  error,
  required,
  children,
}: {
  id: string;
  label: string;
  hint: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
}) {
  const t = useTranslations("Product");
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-sm font-medium">
        {label}
        {required && (
          <span className="text-primary" aria-label={t("requiredField")}>
            *
          </span>
        )}
      </Label>
      {children}
      <p
        id={`${id}-hint`}
        className="text-xs leading-relaxed text-muted-foreground"
      >
        {hint}
      </p>
      {error && (
        <p id={`${id}-error`} className="text-xs text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
