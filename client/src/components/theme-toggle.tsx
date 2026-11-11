"use client";
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
    <div
      className={expanded ? "theme-switch expanded" : "theme-switch"}
      role="radiogroup"
      aria-label={t("appearance")}
    >
      {[
        { value: "light", key: "lightTheme", icon: Sun },
        { value: "dark", key: "darkTheme", icon: Moon },
        { value: "system", key: "systemTheme", icon: Monitor },
      ].map(({ value, key, icon: Icon }) => (
        <button
          key={value}
          type="button"
          role="radio"
          aria-label={t(key)}
          aria-checked={selected === value}
          title={t(key)}
          disabled={!mounted}
          onClick={() => setTheme(value)}
        >
          <Icon size={16} />
          {expanded && <span>{t(key)}</span>}
        </button>
      ))}
    </div>
  );
}
