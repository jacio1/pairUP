import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { Message } from "@/lib/chat-types";
import type { ChatActions } from "./use-chat-actions";

export function DeleteMessageDialog({
  message,
  onClose,
  remove,
}: {
  message: Message;
  onClose: () => void;
  remove: ChatActions["remove"];
}) {
  const t = useTranslations("ChatExtras");
  const errors = useTranslations("Errors");
  const cancel = useRef<HTMLButtonElement>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function confirm() {
    if (pending) return;
    setPending(true);
    const result = await remove(message);
    if (!result) onClose();
    else {
      setError(result);
      setPending(false);
    }
  }
  return (
    <Dialog
      open
      disablePointerDismissal={false}
      onOpenChange={(open) => {
        if (!open && !pending) onClose();
      }}
    >
      <DialogContent initialFocus={cancel} showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>{t("deleteMessage")}</DialogTitle>
          <DialogDescription>{t("deleteConfirm")}</DialogDescription>
        </DialogHeader>
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {errors(error)}
          </p>
        )}
        <DialogFooter>
          <Button
            variant="outline"
            ref={cancel}
            disabled={pending}
            onClick={onClose}
          >
            {t("cancelDelete")}
          </Button>
          <Button
            variant="destructive"
            disabled={pending}
            onClick={() => void confirm()}
          >
            {t("deleteMessage")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
