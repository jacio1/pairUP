"use client";

import { Suspense } from "react";
import { cn } from "cn";
import { Bell, CirclePlus, CircleUser, Home, MessagesCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", labelKey: "home", icon: Home },
  { href: "/messages", labelKey: "messages", icon: MessagesCircle },
  { href: "/create", labelKey: "create", icon: CirclePlus },
  { href: "/notifications", labelKey: "notifications", icon: Bell },
  { href: "/profile", labelKey: "profile", icon: CircleUser },
];

function NavLink({
  href,
  labelKey,
  icon: Icon,
}: {
  href: string;
  labelKey: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  const t = useTranslations("Navigation");
  const pathname = usePathname();
  const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <Link
      href={href}
      className={cn(
        "flex flex-col items-center justify-center text-[12px] py-2",
        isActive ? "text-sidebar-primary" : ""
      )}
    >
      <Icon className="h-6 w-6" />
      <span>{t(labelKey)}</span>
    </Link>
  );
}

function NavLinkFallback({
  href,
  labelKey,
  icon: Icon,
}: {
  href: string;
  labelKey: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  const t = useTranslations("Navigation");
  return (
    <Link
      href={href}
      className="flex flex-col items-center justify-center text-[12px] py-2"
    >
      <Icon className="h-6 w-6" />
      <span>{t(labelKey)}</span>
    </Link>
  );
}

export default function MobileBottom() {
  return (
    <nav className="md:hidden shrink-0 bg-background w-full border-t border-muted-foreground/35 pb-[env(safe-area-inset-bottom)]">
      <ul className="grid grid-cols-5">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Suspense
                fallback={
                  <NavLinkFallback
                    href={item.href}
                    labelKey={item.labelKey}
                    icon={Icon}
                  />
                }
              >
                <NavLink
                  href={item.href}
                  labelKey={item.labelKey}
                  icon={Icon}
                />
              </Suspense>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}