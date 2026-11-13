"use client";
import { Bell, Compass, MessageCircle, PlusCircle, Users } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname } from "next/navigation";
const navigation = [
  { href: "/", key: "discover", icon: Compass },
  { href: "/create", key: "create", icon: PlusCircle },
  { href: "/messages", key: "messages", icon: MessageCircle },
  { href: "/notifications", key: "notifications", icon: Bell },
  { href: "/profile", key: "profile", icon: Users },
];
export function MobileNav() {
  const t = useTranslations("Demo");
  const p = useTranslations("Product");
  const path = usePathname();
  const active = (href: string) =>
    href === "/" ? path === "/" : path.startsWith(href);
  const label = (key: string) =>
    key === "create" || key === "notifications" ? p(key) : t(key);
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 flex justify-around border-t bg-background/95 px-1 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 backdrop-blur min-[761px]:hidden"
      aria-label={t("navigation")}
    >
      {navigation.map(({ href, key, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          aria-label={label(key)}
          title={label(key)}
          aria-current={active(href) ? "page" : undefined}
          className={`flex min-w-0 flex-1 flex-col items-center gap-1 text-[9px] ${active(href) ? "text-primary" : "text-muted-foreground"}`}
        >
          <Icon className="size-5" />
          <span className="sr-only">{label(key)}</span>
        </Link>
      ))}
    </nav>
  );
}
