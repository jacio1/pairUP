"use client";
import { CalendarDays, FileText } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import type { PublicProfile } from "@/lib/profiles-api";
import { ProfileAvatar } from "./profile-avatar";
export function ProfileHeader({
  profile,
  actions,
}: {
  profile: PublicProfile;
  actions?: React.ReactNode;
}) {
  const t = useTranslations("SocialProfile"),
    format = useFormatter();
  return (
    <section className="overflow-hidden rounded-[24px] border bg-card">
      <div aria-hidden="true" className="profile-cover" />
      <div className="px-5 pb-6 sm:px-7">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <ProfileAvatar
            name={profile.name}
            color={profile.avatar}
            className="-mt-10 size-24 border-4 border-card text-3xl sm:size-28"
          />
          <div className="hidden flex-wrap gap-2 pt-4 sm:flex">{actions}</div>
        </div>
        <h1 className="mt-4 text-2xl font-extrabold tracking-tight wrap-anywhere sm:text-3xl">
          {profile.name}
        </h1>
        {profile.bio && (
          <p className="mt-3 max-w-2xl whitespace-pre-wrap text-sm leading-7 text-muted-foreground wrap-anywhere">
            {profile.bio}
          </p>
        )}
        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <CalendarDays className="size-3.5" />
            {t("joined", {
              date: format.dateTime(new Date(profile.createdAt), {
                month: "long",
                year: "numeric",
              }),
            })}
          </span>
          <span className="flex items-center gap-1.5">
            <FileText className="size-3.5" />
            {t("listingCount", { count: profile._count.listings })}
          </span>
        </div>
        {actions && (
          <div className="mt-5 flex max-w-full flex-wrap gap-2 sm:hidden">
            {actions}
          </div>
        )}
      </div>
    </section>
  );
}
