"use client";
import { LogOut } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { useSignOut } from "./use-sign-out";
export function SignOutButton() {
  const t = useTranslations("Auth"),
    errors = useTranslations("Errors");
  const { signOut, isLoading, error } = useSignOut();
  return (
    <div className="space-y-2">
      <Button
        variant="outline"
        className="w-full justify-start gap-3 text-destructive hover:text-destructive"
        disabled={isLoading}
        onClick={() => void signOut()}
      >
        <LogOut className="size-4" />
        {t("logout")}
      </Button>
      {error && (
        <p role="alert" className="text-xs text-destructive">
          {errors("SERVER_ERROR")}
        </p>
      )}
    </div>
  );
}
