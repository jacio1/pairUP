"use client";
import { useAuth } from "@/components/auth/auth-context";
import { Button } from "@/components/ui/button";
import { useAppSelector } from "@/lib/hooks";
import { useMeQuery } from "@/lib/store";
import { LockKeyhole } from "lucide-react";
import { useTranslations } from "next-intl";
import { type ReactNode } from "react";
export function AuthGate({ children }: { children: ReactNode }) {
  const session = useAppSelector((state) => state.chat.session);
  const { isLoading } = useMeQuery();
  const open = useAuth();
  const t = useTranslations("Auth");
  if (isLoading)
    return (
      <div className="p-10 text-center text-muted-foreground">
        {t("loading")}
      </div>
    );
  if (session) return children;
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center px-6 py-20 text-center">
      <LockKeyhole className="mb-6 size-12 text-primary" />
      <h1 className="text-2xl font-semibold">{t("required")}</h1>
      <p className="my-4 text-muted-foreground">{t("requiredText")}</p>
      <Button onClick={open}>{t("login")}</Button>
    </main>
  );
}
