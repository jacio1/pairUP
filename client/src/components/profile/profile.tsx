"use client";
import { Button } from "@/components/ui/button";
import { ExternalLink, Pencil } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { PresenterAccess } from "./presenter-access";
import { ProfileEditDialog } from "./profile-edit-dialog";
import { ProfileMenu } from "./profile-menu";
import { ProfileHeader } from "./profile-header";
import { ProfileAbout } from "./profile-about";
import { ProfileListings } from "./profile-listings";
import { useProfileForm } from "./use-profile-form";
export function Profile() {
  const form = useProfileForm();
  const t = useTranslations("SocialProfile"),
    p = useTranslations("Product");
  const { publicProfile: profile, session, profileStatus } = form;
  if (form.isLoading)
    return (
      <main className="p-8" role="status">
        {t("loading")}
      </main>
    );
  if (!profile)
    return (
      <main className="space-y-4 p-8">
        <p role="alert">{t("loadError")}</p>
        <Button onClick={() => void form.refetch()}>{t("retry")}</Button>
      </main>
    );
  return (
    <main className="page-shell space-y-6">
      <ProfileHeader
        profile={profile}
        actions={
          <>
            <Button
              onClick={() => {
                form.setProfileStatus("");
                form.setEditing(true);
              }}
            >
              <Pencil className="size-4" />
              {p("editProfile")}
            </Button>
            <Button
              variant="outline"
              nativeButton={false}
              render={<Link href={`/users/${profile.id}`} />}
            >
              <ExternalLink className="size-4" />
              {t("viewPublic")}
            </Button>
          </>
        }
      />
      {profileStatus === "profileSaved" && (
        <p role="status" className="text-sm text-primary">
          {p("profileSaved")}
        </p>
      )}
      <div className="grid items-start gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="min-w-0 space-y-5">
          <ProfileAbout profile={profile} />
          <ProfileMenu />
          {session?.role !== "presenter" && <PresenterAccess />}
        </aside>
        <ProfileListings listings={profile.listings} />
      </div>
      <ProfileEditDialog form={form} />
    </main>
  );
}
