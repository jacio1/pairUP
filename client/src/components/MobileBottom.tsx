"use client";

import { cn } from "cn";
import {
  Bell,
  CirclePlus,
  CircleUser,
  Home,
  MessagesCircle,
} from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  {
    href: "/",
    labelKey: "home",
    icon: Home,
  },
  {
    href: "/messages",
    labelKey: "messages",
    icon: MessagesCircle,
  },
  {
    href: "/create",
    labelKey: "create",
    icon: CirclePlus,
  },
  {
    href: "/notifications",
    labelKey: "notifications",
    icon: Bell,
  },
  {
    href: "/profile",
    labelKey: "profile",
    icon: CircleUser,
  },
];

export default function MobileBottom() {
  const t = useTranslations("Navigation");
  const pathname = usePathname();
  return (
    <nav className="md:hidden bg-background fixed bottom-0 left-0 right-0 z-50 w-full border-t border-muted-foreground/35">
      <ul className="grid grid-cols-5">
        {navItems.map((item) => {
          const Icon = item.icon;

          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center text-[12px] py-2",
                  isActive ? "text-sidebar-primary" : "",
                )}
              >
                <Icon className="h-6 w-6" />
                <span>{t(item.labelKey)}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
