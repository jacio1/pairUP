"use client";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { Card } from "@/components/ui/card";
import { Settings } from "lucide-react";
import { useTranslations } from "next-intl";
export function SettingsPage() {
  const t = useTranslations("Product");
  return (
    <main className="page max-w-250 w-full mx-auto p-[37px_48px_35px] flex-1 max-[1200px]:p-[30px] max-[1000px]:p-[26px] max-[760px]:p-[25px_20px] max-[480px]:p-[23px_17px] form-page">
      <div className="page-heading flex justify-between items-center mb-[26px] gap-4 [&_h1]:text-[29px] [&_h1]:font-medium [&_h1]:tracking-[-1.2px] [&_h1]:leading-[1.4] [&_h1_>_span]:font-bold [&_p]:text-[12px] [&_p]:text-muted-foreground [&_p]:mt-[6px] [&_p]:leading-[1.7] max-[760px]:mb-[22px] max-[760px]:[&_h1]:text-[26px] max-[760px]:[&_p]:text-[11px] max-[480px]:[&_h1]:text-[23px] max-[480px]:[&_h1]:tracking-[-0.9px] max-[480px]:[&_h1]:leading-[1.4] max-[480px]:[&_p]:text-[10px] max-[760px]:[&_>_.primary-button]:text-[10px] max-[760px]:[&_>_.primary-button]:p-[9px] max-[760px]:[&_>_.primary-button]:gap-[5px]">
        <div>
          <div className="eyebrow flex gap-[7px] items-center tracking-[1.5px] text-[9px] font-semibold text-muted-foreground mb-[10px] [&_.online-dot]:w-[5px] [&_.online-dot]:h-[5px] max-[480px]:text-[8px]">
            <Settings size={16} />
            PairUp
          </div>
          <h1>{t("settings")}</h1>
          <p>{t("settingsText")}</p>
        </div>
      </div>
      <Card className="block gap-0 ring-0 shadow-none settings-card bg-card [border:1px_solid_var(--border)] rounded-[16px] p-[25px] mb-5 text-card-foreground [&_h2]:text-[16px] [&_h2]:font-semibold [&_h2]:mb-[15px] [&_>_p]:text-[12px] [&_>_p]:leading-[1.8] [&_>_p]:text-muted-foreground [&_>_p]:m-[0_0_20px] [&_.locale-switch]:inline-flex [&_.locale-switch]:[border:1px_solid_var(--border)] [&_.locale-switch]:rounded-[8px] [&_.locale-switch]:p-[5px] [&_.locale-switch_button]:p-[9px_14px] [&_.locale-switch_button]:text-[12px]">
        <h2>{t("appearance")}</h2>
        <p>{t("appearanceText")}</p>
        <ThemeToggle expanded />
      </Card>
      <Card className="block gap-0 ring-0 shadow-none settings-card bg-card [border:1px_solid_var(--border)] rounded-[16px] p-[25px] mb-5 text-card-foreground [&_h2]:text-[16px] [&_h2]:font-semibold [&_h2]:mb-[15px] [&_>_p]:text-[12px] [&_>_p]:leading-[1.8] [&_>_p]:text-muted-foreground [&_>_p]:m-[0_0_20px] [&_.locale-switch]:inline-flex [&_.locale-switch]:[border:1px_solid_var(--border)] [&_.locale-switch]:rounded-[8px] [&_.locale-switch]:p-[5px] [&_.locale-switch_button]:p-[9px_14px] [&_.locale-switch_button]:text-[12px]">
        <h2>{t("interfaceLanguage")}</h2>
        <p>{t("languageText")}</p>
        <LanguageSwitcher />
      </Card>
    </main>
  );
}
