"use client";
import { useTranslations } from "next-intl";
import Link from "next/link";
import type { ProfileForm } from "./use-profile-form";
export function ProfileStats({
  form,
}: {
  form: Pick<ProfileForm, "myListings" | "favorite">;
}) {
  const p = useTranslations("Product");
  const { myListings, favorite } = form;
  return (
    <div className="profile-stats grid grid-cols-[repeat(3,_1fr)] gap-3 mb-6 [&_a]:p-[20px_10px] [&_a]:flex [&_a]:flex-col [&_a]:gap-2 [&_a]:items-center [&_a]:[border:1px_solid_var(--border)] [&_a]:rounded-[12px] [&_a]:bg-card [&_strong]:text-[23px] [&_strong]:text-foreground [&_span]:text-[11px] [&_span]:text-muted-foreground [&_span]:text-center max-[760px]:[&_a]:p-[17px_7px] max-[760px]:[&_span]:text-[10px]">
      <Link href="/my-listings">
        <strong>{myListings?.length ?? 0}</strong>
        <span>{p("myListings")}</span>
      </Link>
      <Link href="/sessions">
        <strong>0</strong>
        <span>{p("sessions")}</span>
      </Link>
      <Link href="/favorites">
        <strong>{favorite ? 1 : 0}</strong>
        <span>{p("favorites")}</span>
      </Link>
    </div>
  );
}
