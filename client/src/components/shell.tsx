"use client";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Button } from "./ui/button";
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
  function label(key: string) {
    return key === "create" || key === "notifications" ? p(key) : t(key);
  }
  return (
    <div className="app-shell flex min-h-dvh max-[760px]:pb-[70px]">
      <aside className="sidebar w-61 shrink-0 bg-sidebar [border-right:1px_solid_var(--border)] flex flex-col p-[34px_23px_0] fixed [inset:0_auto_0_0] z-[30] overflow-y-auto [scrollbar-width:thin] text-sidebar-foreground border-sidebar-border max-[1200px]:w-[210px] max-[1200px]:pl-4 max-[1200px]:pr-4 max-[1000px]:w-[185px] max-[1000px]:pl-3 max-[1000px]:pr-3 max-[760px]:hidden [&_nav]:shrink-0 [&_.brand]:shrink-0">
        <Link
          href="/"
          className="brand flex items-center gap-[9px] text-[30px] font-extrabold tracking-[-1.7px] mb-[49px] [&_>_svg]:text-sidebar-primary [&_>_svg]:[stroke-width:3] [&_>_span_>_span]:text-sidebar-primary [&_small]:text-[8px] [&_small]:tracking-[0.6px] [&_small]:bg-muted [&_small]:text-muted-foreground [&_small]:p-[3px_4px] [&_small]:rounded-[4px] [&_small]:[vertical-align:top] [&_small]:m-[5px_0_0_6px] [&_small]:inline-block max-[1000px]:text-[26px] max-[1000px]:gap-[5px] max-[1000px]:[&_svg]:w-8 max-[1000px]:[&_small]:text-[6px]"
        >
          <InfinityIcon size={39} />
          <span>
            Pair<span>Up</span>
            <small>BETA</small>
          </span>
        </Link>
        <div className="workspace-label text-[9px] font-bold tracking-[1.6px] text-muted-foreground pl-[14px] mb-[15px] max-[1000px]:text-[8px] max-[1000px]:pl-[10px]">
          {t("workspace")}
        </div>
        <nav aria-label={t("navigation")}>
          {navigation.map(({ href, key, icon: Icon }) => (
            <Link
              key={href}
              className={
                active(href)
                  ? "nav-item flex items-center gap-3 p-[13px_15px] mb-[6px] text-[13px] text-muted-foreground rounded-[11px] font-medium [&.active]:bg-sidebar-accent [&.active]:text-sidebar-primary [&.active]:font-semibold [&:hover]:bg-accent [&:hover]:text-accent-foreground [&.muted]:text-muted-foreground max-[1000px]:text-[12px] max-[1000px]:p-[12px_10px] active"
                  : "nav-item flex items-center gap-3 p-[13px_15px] mb-[6px] text-[13px] text-muted-foreground rounded-[11px] font-medium [&.active]:bg-sidebar-accent [&.active]:text-sidebar-primary [&.active]:font-semibold [&:hover]:bg-accent [&:hover]:text-accent-foreground [&.muted]:text-muted-foreground max-[1000px]:text-[12px] max-[1000px]:p-[12px_10px]"
              }
              href={href}
              aria-current={active(href) ? "page" : undefined}
            >
              <Icon size={20} />
              {label(key)}
              {active(href) && (
                <span className="nav-dot ml-auto w-[5px] h-[5px] rounded-full bg-primary" />
              )}
            </Link>
          ))}
        </nav>
        <div className="workspace-label text-[9px] font-bold tracking-[1.6px] text-muted-foreground pl-[14px] mb-[15px] max-[1000px]:text-[8px] max-[1000px]:pl-[10px] roadmap-label mt-[34px]">
          {p("learning")}
        </div>
        <Link
          href="/sessions"
          className={
            active("/sessions")
              ? "nav-item flex items-center gap-3 p-[13px_15px] mb-[6px] text-[13px] text-muted-foreground rounded-[11px] font-medium [&.active]:bg-sidebar-accent [&.active]:text-sidebar-primary [&.active]:font-semibold [&:hover]:bg-accent [&:hover]:text-accent-foreground [&.muted]:text-muted-foreground max-[1000px]:text-[12px] max-[1000px]:p-[12px_10px] active"
              : "nav-item flex items-center gap-3 p-[13px_15px] mb-[6px] text-[13px] text-muted-foreground rounded-[11px] font-medium [&.active]:bg-sidebar-accent [&.active]:text-sidebar-primary [&.active]:font-semibold [&:hover]:bg-accent [&:hover]:text-accent-foreground [&.muted]:text-muted-foreground max-[1000px]:text-[12px] max-[1000px]:p-[12px_10px]"
          }
        >
          <BookOpen size={20} />
          {p("sessions")}
          <span className="soon-dot h-[5px] w-[5px] bg-primary ml-auto rounded-full" />
        </Link>
        <Link
          href="/settings"
          className={
            active("/settings")
              ? "nav-item flex items-center gap-3 p-[13px_15px] mb-[6px] text-[13px] text-muted-foreground rounded-[11px] font-medium [&.active]:bg-sidebar-accent [&.active]:text-sidebar-primary [&.active]:font-semibold [&:hover]:bg-accent [&:hover]:text-accent-foreground [&.muted]:text-muted-foreground max-[1000px]:text-[12px] max-[1000px]:p-[12px_10px] active"
              : "nav-item flex items-center gap-3 p-[13px_15px] mb-[6px] text-[13px] text-muted-foreground rounded-[11px] font-medium [&.active]:bg-sidebar-accent [&.active]:text-sidebar-primary [&.active]:font-semibold [&:hover]:bg-accent [&:hover]:text-accent-foreground [&.muted]:text-muted-foreground max-[1000px]:text-[12px] max-[1000px]:p-[12px_10px]"
          }
        >
          <Settings size={20} />
          {p("settings")}
        </Link>
        <div className="sidebar-bottom mt-auto [background:linear-gradient(_140deg,_color-mix(in_oklab,_var(--primary)_4%,_var(--card)),_color-mix(in_oklab,_var(--primary)_4%,_var(--card))_)] p-[19px_16px] rounded-[15px] mb-6 [&_strong]:text-[12px] [&_strong]:block [&_strong]:leading-[1.6] [&_p]:text-[11px] [&_p]:text-muted-foreground [&_p]:leading-[1.8] [&_p]:m-[6px_0_12px] [&_a]:text-[11px] [&_a]:text-sidebar-primary [&_a]:flex [&_a]:items-center [&_a]:gap-[5px] [&_a]:font-semibold max-[1000px]:p-[14px]">
          <div className="small-neuron h-[41px] w-[41px] rounded-[13px] bg-muted text-sidebar-primary inline-flex items-center justify-center mb-[13px]">
            <Sparkles size={22} />
          </div>
          <strong>{t("littleHelp")}</strong>
          <p>{t("littleHelpText")}</p>
          <Link href="/messages/study-group">
            {t("meetNeuron")}
            <ArrowUpRight size={15} />
          </Link>
        </div>
        <Link
          href="/profile"
          className="sidebar-foot [border-top:1px_solid_var(--border)] flex items-center gap-[10px] m-[0_-23px] p-[20px_23px] shrink-0 [&_strong]:text-[11px] [&_strong]:block [&_small]:block [&_small]:text-[9px] [&_small]:text-muted-foreground [&_small]:mt-1 [&_>_.online-dot]:ml-auto max-[1200px]:ml-[-16px] max-[1200px]:mr-[-16px] max-[1200px]:pl-4 max-[1200px]:pr-4 max-[1000px]:m-[0_-12px] max-[1000px]:p-[17px_12px]"
        >
          <Avatar className="avatar inline-flex items-center justify-center bg-muted text-sidebar-primary rounded-full font-semibold shrink-0 [&.tiny]:h-8 [&.tiny]:w-8 [&.tiny]:text-[12px] [&.avatar-teal]:[background:color-mix(in_oklab,_var(--primary)_9%,_var(--card))] [&.avatar-teal]:text-muted-foreground [&.avatar-peach]:[background:color-mix(in_oklab,_var(--primary)_7%,_var(--card))] [&.avatar-peach]:text-primary [&.avatar-violet]:[background:color-mix(in_oklab,_var(--primary)_6%,_var(--card))] [&.avatar-violet]:text-primary tiny">
            <AvatarFallback className="bg-transparent text-inherit [font-size:inherit]">
              {session?.role === "presenter" ? "P" : "T"}
            </AvatarFallback>
          </Avatar>
          <div>
            <strong>{session?.name || t("guest")}</strong>
            <small>{t("demoWorkspace")}</small>
          </div>
          <span className="online-dot w-[6px] h-[6px] bg-sidebar-primary rounded-full inline-block shrink-0" />
        </Link>
      </aside>
      <div className="main-column min-w-0 flex-1 ml-61 flex flex-col max-[1200px]:ml-[210px] max-[1000px]:ml-[185px] max-[760px]:ml-0">
        <header className="hidden h-16 shrink-0 items-center justify-end border-b border-border bg-card/70 px-8 min-[761px]:flex">
          <Link
            href="/profile"
            aria-label={t("profile")}
            className="rounded-full focus-visible:outline-2 focus-visible:outline-ring"
          >
            <Avatar>
              <AvatarFallback className="text-primary">
                {session?.role === "presenter" ? "P" : "T"}
              </AvatarFallback>
            </Avatar>
          </Link>
        </header>
        {children}
      </div>
      <nav
        className="mobile-nav hidden max-[760px]:fixed max-[760px]:bottom-0 max-[760px]:left-0 max-[760px]:right-0 max-[760px]:z-[40] max-[760px]:flex max-[760px]:[justify-content:space-around] max-[760px]:items-center max-[760px]:[background:color-mix(in_oklab,_var(--card)_93%,_transparent)] max-[760px]:[backdrop-filter:blur(14px)] max-[760px]:[border-top:1px_solid_var(--border)] max-[760px]:p-[10px_5px_calc(10px_+_env(safe-area-inset-bottom))] max-[760px]:[&_a]:flex max-[760px]:[&_a]:flex-col max-[760px]:[&_a]:items-center max-[760px]:[&_a]:gap-[5px] max-[760px]:[&_a]:text-muted-foreground max-[760px]:[&_a]:text-[8px] max-[760px]:[&_a]:min-w-0 max-[760px]:[&_a]:flex-1 max-[760px]:[&_a]:text-center max-[760px]:[&_a[aria-current=page]]:text-primary"
        aria-label={t("navigation")}
      >
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
