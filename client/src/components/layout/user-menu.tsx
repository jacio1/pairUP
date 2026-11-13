"use client";
import { useAuth } from "@/components/auth/auth-context";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { actions, api, useLogoutMutation } from "@/lib/store";
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
import { useRouter } from "next/navigation";
export function UserMenu() {
  const t = useTranslations("Demo");
  const p = useTranslations("Product");
  const a = useTranslations("Auth");
  const session = useAppSelector((s) => s.chat.session);
  const openAuth = useAuth();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [logout] = useLogoutMutation();
  async function signOut() {
    try {
      await logout().unwrap();
      dispatch(actions.session(null));
      dispatch(actions.room());
      dispatch(api.util.resetApiState());
      router.push("/");
    } catch {
      /* Keep the authenticated state when logout fails. */
    }
  }
  return (
    <>
      {" "}
      {session ? (
        <Popover>
          <PopoverTrigger
            render={<Button variant="ghost" className="gap-2 px-1 sm:px-3" />}
          >
            <Avatar className="size-8">
              <AvatarFallback>{session.name.slice(0, 1)}</AvatarFallback>
            </Avatar>
            <span className="hidden text-sm sm:inline">{session.name}</span>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-56 p-2">
            <p className="px-3 py-2 text-sm font-semibold">{session.name}</p>
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
              onClick={() => void signOut()}
            >
              <LogOut className="size-4" />
              {a("logout")}
            </Button>
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
