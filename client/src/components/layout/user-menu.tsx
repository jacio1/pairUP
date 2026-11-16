"use client";
import { useAuth } from "@/components/auth/auth-context";
import { ProfileAvatar } from "@/components/profile/profile-avatar";
import { useMyProfileQuery } from "@/lib/profiles-api";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useSignOut } from "@/components/auth/use-sign-out";
import { useAppSelector } from "@/lib/hooks";
import {
  BookOpen,
  FileText,
  Heart,
  LogOut,
  Settings,
  Users,
} from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
export function UserMenu() {
  const t = useTranslations("Demo");
  const p = useTranslations("Product");
  const a = useTranslations("Auth");
  const session = useAppSelector((s) => s.chat.session);
  const { data: profile } = useMyProfileQuery(undefined, { skip: !session });
  const displayName = profile?.name || session?.name || "";
  const openAuth = useAuth();
  const { signOut, isLoading, error } = useSignOut();
  const errors = useTranslations("Errors");
  return (
    <>
      {" "}
      {session ? (
        <Popover>
          <PopoverTrigger
            render={<Button variant="ghost" className="gap-2 px-1 sm:px-3" />}
          >
            <ProfileAvatar
              name={displayName}
              color={profile?.avatar}
              className="size-8 text-sm"
            />
            <span className="hidden max-w-32 truncate text-sm lg:inline">
              {displayName}
            </span>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-56 p-2">
            <p className="truncate px-3 py-2 text-sm font-semibold">
              {displayName}
            </p>
            {[
              { href: "/profile", text: t("profile"), icon: Users },
              {
                href: "/my-listings",
                text: p("myListings"),
                icon: FileText,
              },
              { href: "/favorites", text: p("favorites"), icon: Heart },
              { href: "/sessions", text: p("sessions"), icon: BookOpen },
              { href: "/settings", text: p("settings"), icon: Settings },
            ].map(({ href, text, icon: Icon }) => (
              <Button
                key={href}
                className="w-full justify-start"
                variant="ghost"
                nativeButton={false}
                render={<Link href={href} />}
              >
                <Icon className="size-4" />
                {text}
              </Button>
            ))}
            <Button
              variant="ghost"
              className="w-full justify-start"
              disabled={isLoading}
              onClick={() => void signOut()}
            >
              <LogOut className="size-4" />
              {a("logout")}
            </Button>
            {error && (
              <p role="alert" className="px-3 py-2 text-xs text-destructive">
                {errors("SERVER_ERROR")}
              </p>
            )}
          </PopoverContent>
        </Popover>
      ) : (
        <Button variant="outline" onClick={openAuth}>
          {a("login")}
        </Button>
      )}
    </>
  );
}
