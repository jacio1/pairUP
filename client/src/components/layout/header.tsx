"use client";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { Button } from "@/components/ui/button";
import { useAppSelector } from "@/lib/hooks";
import { useProposalsQuery } from "@/lib/store";
import {
  Bell,
  BookOpen,
  Infinity as InfinityIcon,
  MessageCircle,
  PlusCircle,
} from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AppearanceMenu } from "./appearance-menu";
import { UserMenu } from "./user-menu";
export function Header() {
  const t = useTranslations("Demo");
  const p = useTranslations("Product");
  const session = useAppSelector((s) => s.chat.session);
  const path = usePathname();
  const { data: proposals = [] } = useProposalsQuery(undefined, {
    skip: !session,
    pollingInterval: 15000,
  });
  const count = proposals.filter(
    (p) => p.incoming && p.status === "pending",
  ).length;
  const active = (href: string) =>
    href === "/" ? path === "/" : path.startsWith(href);
  return (
    <header className="sticky top-0 z-30 hidden min-[761px]:block border-b bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-17 max-w-7xl items-center gap-3 px-4 sm:px-6">
        <Link
          href="/"
          className="mr-auto flex items-center gap-2 text-2xl font-bold tracking-tight"
        >
          <InfinityIcon className="size-8 text-primary" />
          Pair<span className="-ml-2 text-primary">Up</span>
        </Link>
        <nav
          className="hidden items-center gap-1 min-[761px]:flex"
          aria-label={t("navigation")}
        >
          <Button
            variant={active("/") ? "secondary" : "ghost"}
            nativeButton={false}
            render={<Link href="/" />}
          >
            {t("discover")}
          </Button>
          <Button
            variant="ghost"
            nativeButton={false}
            render={<Link href="/sessions" />}
          >
            <BookOpen className="size-4" />
            <span className="hidden lg:inline">{p("sessions")}</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label={t("messages")}
            nativeButton={false}
            render={<Link href="/messages" />}
          >
            <MessageCircle />
          </Button>
          <Button
            className="relative"
            variant="ghost"
            size="icon"
            aria-label={p("notifications")}
            nativeButton={false}
            render={<Link href="/notifications" />}
          >
            <Bell />
            {count > 0 && (
              <span className="absolute right-0 top-0 rounded-full bg-primary px-1 text-[10px] text-primary-foreground">
                {count}
              </span>
            )}
          </Button>
          <Button nativeButton={false} render={<Link href="/create" />}>
            <PlusCircle className="size-4" />
            {p("create")}
          </Button>
        </nav>
        <div className="hidden xl:block">
          <LanguageSwitcher />
        </div>
        <AppearanceMenu />
        <UserMenu />
      </div>
    </header>
  );
}
