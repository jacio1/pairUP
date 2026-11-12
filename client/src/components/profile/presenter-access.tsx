"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { errorCode } from "@/lib/errors";
import { useAppDispatch } from "@/lib/hooks";
import { actions, api, useLoginMutation } from "@/lib/store";
import { LockKeyhole } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, type SubmitEvent } from "react";
export function PresenterAccess() {
  const t = useTranslations("Demo");
  const errors = useTranslations("Errors");
  const dispatch = useAppDispatch();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [login, { isLoading }] = useLoginMutation();
  async function submit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    try {
      const result = await login({ password }).unwrap();
      dispatch(api.util.upsertQueryData("me", undefined, result));
      dispatch(actions.session(result));
      setPassword("");
    } catch (e) {
      setError(errorCode(e));
    }
  }
  return (
    <form
      className="presenter-form p-[30px] [border:1px_solid_var(--border)] bg-card rounded-[18px] mb-6 [&_>_p]:text-[13px] [&_>_p]:leading-[1.8] [&_>_p]:text-muted-foreground [&_>_p]:mb-5 [&_h2]:flex [&_h2]:gap-[10px] [&_h2]:items-center [&_h2]:text-[16px] [&_h2]:mb-[10px] max-[760px]:p-[23px]"
      onSubmit={submit}
    >
      <h2>
        <LockKeyhole size={20} />
        {t("presenterLogin")}
      </h2>
      <Label className="mb-2 mt-4 block text-xs font-medium" htmlFor="password">
        {t("password")}
      </Label>
      <Input
        id="password"
        type="password"
        autoComplete="current-password"
        required
        maxLength={256}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <Button
        type="submit"
        variant="secondary"
        className="secondary-button min-h-10"
        disabled={isLoading}
      >
        {t(isLoading ? "joining" : "signIn")}
      </Button>
      {error && (
        <p
          className="error-text text-[11px] text-destructive! mt-[10px]! leading-[1.6]"
          role="alert"
        >
          {errors(error)}
        </p>
      )}
    </form>
  );
}
