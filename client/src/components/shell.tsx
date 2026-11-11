"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useTransition } from "react";
import {
  ArrowUpRight,
  Bell,
  BookOpen,
  Compass,
  Globe2,
  Infinity as InfinityIcon,
  MessageCircle,
  PlusCircle,
  Settings,
  Sparkles,
  Users,
} from "lucide-react";
import { setLocale } from "@/i18n/actions";
import { useAppSelector } from "./providers";
import { ThemeToggle } from "./theme-toggle";

export function LanguageSwitcher() {
  const t = useTranslations("Demo");
  const locale = useLocale();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <div className="locale-switch" role="group" aria-label={t("language")}>
      <Globe2 size={15} />
      {(["en", "ru"] as const).map((language) => (
        <button
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
        </button>
      ))}
    </div>
  );
}
const navigation = [
  { href: "/", key: "discover", icon: Compass },
  { href: "/create", key: "create", icon: PlusCircle },
  { href: "/messages", key: "messages", icon: MessageCircle },
  { href: "/notifications", key: "notifications", icon: Bell },
  { href: "/profile", key: "profile", icon: Users },
];
export function Shell({ children }: { children: React.ReactNode }) {
  const t = useTranslations("Demo");
  const p = useTranslations("Product");
  const path = usePathname();
  const session = useAppSelector((s) => s.chat.session);
  const active = (href: string) =>
    href === "/" ? path === "/" : path.startsWith(href);
  const current = navigation.find((item) => active(item.href));
  const title = current
    ? current.key === "create" || current.key === "notifications"
      ? p(current.key)
      : t(current.key)
    : p(
        path === "/settings"
          ? "settings"
          : path === "/my-listings"
            ? "myListings"
            : path === "/favorites"
              ? "favorites"
              : "sessions",
      );
  function label(key: string) {
    return key === "create" || key === "notifications" ? p(key) : t(key);
  }
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Link href="/" className="brand">
          <InfinityIcon size={39} />
          <span>
            Pair<span>Up</span>
            <small>BETA</small>
          </span>
        </Link>
        <div className="workspace-label">{t("workspace")}</div>
        <nav aria-label={t("navigation")}>
          {navigation.map(({ href, key, icon: Icon }) => (
            <Link
              key={href}
              className={active(href) ? "nav-item active" : "nav-item"}
              href={href}
              aria-current={active(href) ? "page" : undefined}
            >
              <Icon size={20} />
              {label(key)}
              {active(href) && <span className="nav-dot" />}
            </Link>
          ))}
        </nav>
        <div className="workspace-label roadmap-label">{p("learning")}</div>
        <Link
          href="/sessions"
          className={active("/sessions") ? "nav-item active" : "nav-item"}
        >
          <BookOpen size={20} />
          {p("sessions")}
          <span className="soon-dot" />
        </Link>
        <Link
          href="/settings"
          className={active("/settings") ? "nav-item active" : "nav-item"}
        >
          <Settings size={20} />
          {p("settings")}
        </Link>
        <div className="sidebar-bottom">
          <div className="small-neuron">
            <Sparkles size={22} />
          </div>
          <strong>{t("littleHelp")}</strong>
          <p>{t("littleHelpText")}</p>
          <Link href="/messages/study-group">
            {t("meetNeuron")}
            <ArrowUpRight size={15} />
          </Link>
        </div>
        <Link href="/profile" className="sidebar-foot">
          <span className="avatar tiny">
            {session?.role === "presenter" ? "P" : "T"}
          </span>
          <div>
            <strong>{session?.name || t("guest")}</strong>
            <small>{t("demoWorkspace")}</small>
          </div>
          <span className="online-dot" />
        </Link>
      </aside>
      <div className="main-column">
        <header className="topbar">
          <div className="breadcrumb">
            <span>PairUp</span>
            <span>/</span>
            <strong>{title}</strong>
          </div>
          <div className="top-actions">
            <ThemeToggle />
            <LanguageSwitcher />
            <Link
              className="avatar tiny top-avatar"
              href="/profile"
              aria-label={t("profile")}
            >
              {session?.role === "presenter" ? "P" : "T"}
            </Link>
          </div>
        </header>
        {children}
      </div>
      <nav className="mobile-nav" aria-label={t("navigation")}>
        {navigation.map(({ href, key, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            aria-current={active(href) ? "page" : undefined}
          >
            <Icon size={20} />
            {label(key)}
          </Link>
        ))}
      </nav>
    </div>
  );
}
