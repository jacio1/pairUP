"use client";
import { Button } from "@/components/ui/button";
import { setLocale } from "@/i18n/actions";
import { Globe2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
export function LanguageSwitcher() {
  const t = useTranslations("Demo");
  const locale = useLocale();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <div
      className="locale-switch inline-flex items-center gap-1 rounded-md border border-input p-1 text-muted-foreground"
      role="group"
      aria-label={t("language")}
    >
      <Globe2 size={15} className="mx-2" />
      {(["en", "ru"] as const).map((language) => (
        <Button
          variant={locale === language ? "secondary" : "ghost"}
          size="sm"
          key={language}
          disabled={pending}
          aria-pressed={locale === language}
          onClick={() =>
            startTransition(async () => {
              await setLocale(language);
              router.refresh();
            })
          }
        >
          {language.toUpperCase()}
        </Button>
      ))}
    </div>
  );
}
