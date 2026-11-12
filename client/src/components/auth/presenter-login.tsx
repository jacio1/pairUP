"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTranslations } from "next-intl";
export function PresenterLogin({
  test,
  isLoading,
}: {
  test: (password?: string) => Promise<void>;
  isLoading: boolean;
}) {
  const t = useTranslations("Auth");
  return (
    <details className="text-sm text-muted-foreground">
      <summary className="cursor-pointer">{t("presenter")}</summary>
      <form
        className="mt-3 flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          void test(String(data.get("password")));
        }}
      >
        <Input
          aria-label={t("password")}
          name="password"
          type="password"
          required
          autoComplete="current-password"
        />
        <Button disabled={isLoading}>{t("login")}</Button>
      </form>
    </details>
  );
}
