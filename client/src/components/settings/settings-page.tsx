"use client";
import { PageHeading } from "@/components/layout/page-heading";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { Globe2, Palette } from "lucide-react";
import { useTranslations } from "next-intl";
export function SettingsPage() {
  const t = useTranslations("Product");
  return (
    <main className="page-shell">
      <PageHeading title={t("settings")} description={t("settingsText")} />
      <div className="max-w-4xl divide-y divide-border overflow-hidden rounded-[24px] border bg-card">
        <section className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[minmax(0,1fr)_auto]">
          <div className="flex gap-4">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary">
              <Palette className="size-5" />
            </span>
            <div>
              <h2 className="text-base font-bold">{t("appearance")}</h2>
              <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
                {t("appearanceText")}
              </p>
            </div>
          </div>
          <div className="self-center">
            <ThemeToggle expanded />
          </div>
        </section>
        <section className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[minmax(0,1fr)_auto]">
          <div className="flex gap-4">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary">
              <Globe2 className="size-5" />
            </span>
            <div>
              <h2 className="text-base font-bold">{t("interfaceLanguage")}</h2>
              <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
                {t("languageText")}
              </p>
            </div>
          </div>
          <div className="self-center">
            <LanguageSwitcher />
          </div>
        </section>
      </div>
    </main>
  );
}
