"use client";
import { Button } from "@/components/ui/button";
import { NeuronMascot } from "@/components/neuron-mascot";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAppDispatch } from "@/lib/hooks";
import { actions, api, useLoginMutation } from "@/lib/store";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { CredentialsForm } from "./credentials-form";
import { EmailVerification } from "./email-verification";
import { PresenterLogin } from "./presenter-login";
export function AuthDialog({
  open,
  setOpen,
}: {
  open: boolean;
  setOpen: (value: boolean) => void;
}) {
  const t = useTranslations("Auth");
  const [register, setRegister] = useState(false);
  const [verification, setVerification] = useState(false);
  const [email, setEmail] = useState("");
  const [error, setError] = useState(false);
  const [login, { isLoading }] = useLoginMutation();
  const dispatch = useAppDispatch();
  async function test(password?: string) {
    setError(false);
    try {
      const result = await login(
        password === undefined ? {} : { password },
      ).unwrap();
      dispatch(api.util.upsertQueryData("me", undefined, result));
      dispatch(actions.session(result));
      setOpen(false);
      setVerification(false);
    } catch {
      setError(true);
    }
  }
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        showCloseButton={false}
        className="max-h-[95dvh] overflow-y-auto max-sm:w-[calc(100%_-_1rem)] sm:max-w-md"
      >
        <Button
          variant="ghost"
          size="icon-sm"
          className="absolute right-4 top-4"
          aria-label={t("close")}
          onClick={() => setOpen(false)}
        >
          <X className="size-4" />
        </Button>
        <DialogHeader className="border-b border-border pb-5">
          <NeuronMascot className="mb-2 size-20" />
          <DialogTitle>
            {verification
              ? t("verifyTitle")
              : t(register ? "register" : "login")}
          </DialogTitle>
          <DialogDescription>
            {verification ? t("verifyText", { email }) : t("welcome")}
          </DialogDescription>
        </DialogHeader>
        {verification ? (
          <EmailVerification onBack={() => setVerification(false)} />
        ) : (
          <CredentialsForm
            register={register}
            setRegister={setRegister}
            email={email}
            setEmail={setEmail}
            onVerify={() => setVerification(true)}
          />
        )}
        <div className="border-t pt-4">
          <Button
            className="w-full"
            variant="secondary"
            disabled={isLoading}
            onClick={() => void test()}
          >
            {t("testLogin")}
          </Button>
        </div>
        {!verification && <PresenterLogin test={test} isLoading={isLoading} />}
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {t("loginError")}
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
