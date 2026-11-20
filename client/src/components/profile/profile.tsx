"use client";
import { Button } from "@/components/ui/button";
import { ExternalLink, Pencil } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { ProfileEditDialog } from "./profile-edit-dialog";
import { ProfileMenu } from "./profile-menu";
import { ProfileHeader } from "./profile-header";
import { ProfileSocial } from "./profile-social";
import { ProfileAbout } from "./profile-about";
import { useProfileForm } from "./use-profile-form";
export function Profile() {
  const form = useProfileForm();
  const t = useTranslations("SocialProfile"),
    p = useTranslations("Product");
  const { publicProfile: profile, profileStatus } = form;
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
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="min-w-0 space-y-6">
          <ProfileAbout profile={profile} />
          <ProfileSocial id={profile.id} />
        </div>
        <aside className="min-w-0 space-y-5">
          <ProfileMenu />
          <SignOutButton />
        </aside>
      </div>
      <ProfileEditDialog form={form} />
    </main>
  );
}
