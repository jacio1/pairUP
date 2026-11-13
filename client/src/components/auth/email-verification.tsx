"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MailCheck } from "lucide-react";
import { useTranslations } from "next-intl";
export function EmailVerification({ onBack }: { onBack: () => void }) {
  const t = useTranslations("Auth");
  return (
    <div className="space-y-5">
      <MailCheck className="mx-auto size-12 text-primary" />
      <Label htmlFor="email-code">{t("code")}</Label>
      <Input
        id="email-code"
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={6}
        placeholder="000000"
      />
      <p className="text-sm text-muted-foreground">{t("emailUnavailable")}</p>
      <Button variant="outline" className="w-full" onClick={() => onBack()}>
        {t("back")}
      </Button>
    </div>
  );
}
