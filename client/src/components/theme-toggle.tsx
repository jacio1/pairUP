"use client";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Label } from "./ui/label";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";
import { Sun, Moon, Monitor } from "lucide-react";
const subscribe = () => () => {};
export function ThemeToggle({ expanded = false }: { expanded?: boolean }) {
  const { theme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
  const t = useTranslations("Product");
  const selected = mounted ? theme || "system" : "system";
  return (
    <RadioGroup
      className="flex flex-wrap gap-2"
      value={selected}
      onValueChange={(value) => setTheme(String(value))}
      disabled={!mounted}
      aria-label={t("appearance")}
    >
      {[
        { value: "light", key: "lightTheme", icon: Sun },
        { value: "dark", key: "darkTheme", icon: Moon },
        { value: "system", key: "systemTheme", icon: Monitor },
      ].map(({ value, key, icon: Icon }) => (
        <Label
          key={value}
          className="flex cursor-pointer items-center gap-2 rounded-md border border-input px-3 py-2 text-sm has-[[data-checked]]:border-primary has-[[data-checked]]:bg-accent has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring"
          title={t(key)}
        >
          <RadioGroupItem value={value} aria-label={t(key)} />
          <Icon size={16} />
          {expanded && <span>{t(key)}</span>}
        </Label>
      ))}
    </RadioGroup>
  );
}
