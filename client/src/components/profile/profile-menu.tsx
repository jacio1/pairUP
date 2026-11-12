"use client";
import {
  BookOpen,
  ChevronRight,
  FileText,
  Heart,
  Settings,
} from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
export function ProfileMenu() {
  const p = useTranslations("Product");
  return (
    <nav
      className="profile-menu bg-card [border:1px_solid_var(--border)] rounded-[16px] overflow-hidden mb-6 [&_a]:p-[18px_22px] [&_a]:flex [&_a]:items-center [&_a]:gap-3 [&_a]:text-[13px] [&_a]:[border-bottom:1px_solid_var(--border)] [&_a:last-child]:[border-bottom:0] [&_a:hover]:bg-muted [&_svg]:text-muted-foreground [&_a_>_span]:flex-1"
      aria-label={p("accountSections")}
    >
      {[
        { href: "/my-listings", label: "myListings", icon: FileText },
        { href: "/favorites", label: "favorites", icon: Heart },
        { href: "/sessions", label: "sessions", icon: BookOpen },
        { href: "/settings", label: "settings", icon: Settings },
      ].map(({ href, label, icon: Icon }) => (
        <Link key={href} href={href}>
          <Icon size={19} />
          <span>{p(label)}</span>
          <ChevronRight size={17} />
        </Link>
      ))}
    </nav>
  );
}
