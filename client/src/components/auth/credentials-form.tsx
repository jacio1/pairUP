"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTranslations } from "next-intl";
export function CredentialsForm({
  register,
  setRegister,
  email,
  setEmail,
  onVerify,
}: {
  register: boolean;
  setRegister: (value: boolean) => void;
  email: string;
  setEmail: (value: string) => void;
  onVerify: () => void;
}) {
  const t = useTranslations("Auth");
  return (
    <>
      <div className="grid grid-cols-2 gap-2">
        <Button
          variant={!register ? "secondary" : "ghost"}
          onClick={() => setRegister(false)}
        >
          {t("login")}
        </Button>
        <Button
          variant={register ? "secondary" : "ghost"}
          onClick={() => setRegister(true)}
        >
          {t("register")}
        </Button>
      </div>
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          onVerify();
        }}
      >
        {register && (
          <div className="space-y-2">
            <Label htmlFor="auth-username">{t("username")}</Label>
            <Input
              id="auth-username"
              name="username"
              autoComplete="username"
              required
              minLength={3}
              maxLength={40}
            />
          </div>
        )}
        <div className="space-y-2">
          <Label htmlFor="auth-email">Email</Label>
          <Input
            id="auth-email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="auth-password">{t("password")}</Label>
          <Input
            id="auth-password"
            type="password"
            autoComplete={register ? "new-password" : "current-password"}
            required
            minLength={8}
            maxLength={128}
          />
        </div>
        <Button type="submit" className="w-full">
          {t("continue")}
        </Button>
      </form>
    </>
  );
}
