"use client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useTranslations } from "next-intl";
import { ProfileEditor } from "./profile-editor";
import type { ProfileForm } from "./use-profile-form";

export function ProfileEditDialog({ form }: { form: ProfileForm }) {
  const p = useTranslations("Product");
  return (
    <Dialog
      open={form.editing}
      onOpenChange={(open) => {
        if (form.saving) return;
        form.setEditing(open);
        form.setProfileStatus("");
      }}
    >
      <DialogContent
        className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-xl"
        showCloseButton={false}
      >
        <DialogHeader>
          <DialogTitle className="text-xl">{p("editProfile")}</DialogTitle>
          <DialogDescription>{p("studyProfile")}</DialogDescription>
        </DialogHeader>
        {form.editing && (
          <ProfileEditor
            form={form}
            onSaved={() => form.setEditing(false)}
            onCancel={() => form.setEditing(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
