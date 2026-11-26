"use client";
import { Button } from "@/components/ui/button";
import {
  BookOpen,
  Infinity as InfinityIcon,
  MessageCircle,
  Newspaper,
  PlusCircle,
} from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserMenu } from "./user-menu";
export function Header() {
  const t = useTranslations("Demo");
  const p = useTranslations("Product");
  const social = useTranslations("Social");
  const path = usePathname();
  const active = (href: string) =>
    href === "/" ? path === "/" : path.startsWith(href);
  return (
    <header className="sticky top-0 z-30 hidden min-[761px]:block border-b border-border/80 bg-card/95 backdrop-blur-xl">
      <div className="mx-auto flex h-20 max-w-[1280px] items-center gap-3 px-5 sm:px-8">
        <Link
          href="/"
          className="mr-auto flex items-center gap-2.5 text-2xl font-extrabold tracking-[-0.06em]"
        >
          <span className="flex size-10 items-center justify-center rounded-[14px] bg-primary text-primary-foreground">
            <InfinityIcon className="size-7" />
          </span>
          <span>PairUp</span>
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
            variant={active("/news") ? "secondary" : "ghost"}
            nativeButton={false}
            render={<Link href="/news" />}
            aria-current={active("/news") ? "page" : undefined}
          >
            <Newspaper className="size-4" />
            {social("news")}
          </Button>
          <Button
            variant={active("/sessions") ? "secondary" : "ghost"}
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
          <Button nativeButton={false} render={<Link href="/create" />}>
            <PlusCircle className="size-4" />
            {p("create")}
          </Button>
        </nav>
        <UserMenu />
      </div>
    </header>
  );
}
