"use client";
import { JoinButton } from "@/components/auth/join-button";
import { GraduationCap } from "lucide-react";
import { useTranslations } from "next-intl";
export function GuestRoom({ title }: { title: string }) {
  const t = useTranslations("Demo");
  const room = useTranslations("Room");
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
      <span className="flex size-16 items-center justify-center rounded-2xl bg-primary/8 text-primary">
        <GraduationCap className="size-8" />
      </span>
      <div className="max-w-sm">
        <h2 className="text-xl font-semibold">{title}</h2>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          {room("joinDescription")}
        </p>
      </div>
      <JoinButton label={t("joinConversation")} />
    </div>
  );
}
