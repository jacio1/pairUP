"use client";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useTranslations } from "next-intl";
import type { ChatActions } from "./use-chat-actions";
export function ClearChatDialog({
  chat,
}: {
  chat: Pick<ChatActions, "confirmReset" | "setConfirmReset" | "clear">;
}) {
  const t = useTranslations("Demo");
  const { confirmReset, setConfirmReset, clear } = chat;
  return (
    <AlertDialog open={confirmReset} onOpenChange={setConfirmReset}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("clearChat")}</AlertDialogTitle>
          <AlertDialogDescription>{t("clearConfirm")}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={clear}>
            {t("clearChat")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
