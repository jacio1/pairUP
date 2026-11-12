"use client";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Settings } from "lucide-react";
import { useTranslations } from "next-intl";
export function AppearanceMenu() {
  const p = useTranslations("Product");
  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button variant="ghost" size="icon" aria-label={p("appearance")} />
        }
      >
        <Settings className="size-5" />
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 space-y-4">
        <p className="text-sm font-medium">{p("appearance")}</p>
        <ThemeToggle expanded />
        <LanguageSwitcher />
      </PopoverContent>
    </Popover>
  );
}
