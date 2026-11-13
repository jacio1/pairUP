"use client";
import { Button } from "@/components/ui/button";
import { useMyProfileQuery, usePublicProfileQuery } from "@/lib/profiles-api";
import { useAppSelector } from "@/lib/hooks";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { ProfileHeader } from "./profile-header";
import { ProfileAbout } from "./profile-about";
import { ProfileListings } from "./profile-listings";
export function PublicProfilePage({ id }: { id: string }) {
  const t = useTranslations("SocialProfile");
  const session = useAppSelector((state) => state.chat.session);
  const { data: mine } = useMyProfileQuery(undefined, { skip: !session });
  const {
    data: profile,
    isLoading,
    error,
    refetch,
  } = usePublicProfileQuery(id, { refetchOnMountOrArgChange: true });
  if (isLoading)
    return (
      <main className="p-8" role="status">
        {t("loading")}
      </main>
    );
  if (!profile || error)
    return (
      <main className="mx-auto w-full max-w-3xl space-y-4 px-5 py-12">
        <h1 className="text-xl font-semibold">
          {t(
            (error as { status?: number })?.status === 404
              ? "notFound"
              : "loadError",
          )}
        </h1>
        <Button variant="outline" onClick={() => void refetch()}>
          {t("retry")}
        </Button>
        <Link className="ml-4 text-sm text-primary" href="/">
          {t("back")}
        </Link>
      </main>
    );
  return (
    <main className="page-shell space-y-6">
      <Link
        href="/"
        className="text-sm text-muted-foreground hover:text-primary"
      >
        ← {t("back")}
      </Link>
      <ProfileHeader
        profile={profile}
        actions={
          mine?.id === profile.id ? (
            <Button
              variant="outline"
              nativeButton={false}
              render={<Link href="/profile" />}
            >
              {t("myProfile")}
            </Button>
          ) : undefined
        }
      />
      <div className="grid items-start gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <ProfileAbout profile={profile} />
        <ProfileListings listings={profile.listings} />
      </div>
    </main>
  );
}
