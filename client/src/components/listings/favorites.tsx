"use client";
import { EmptyState } from "@/components/empty-state";
import { PageHeading } from "@/components/layout/page-heading";
import { EnglishLessonCard } from "@/components/listings/english-lesson-card";
import { Button } from "@/components/ui/button";
import { useBrowserStorage } from "@/lib/browser-storage";
import { Heart } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
export function Favorites() {
  const t = useTranslations("Product"),
    d = useTranslations("Demo");
  const [favorite] = useBrowserStorage("pairup.favorite.demo-listing", false);
  return (
    <main className="page-shell">
      <PageHeading title={t("favorites")} description={t("favoritesText")} />
      {favorite ? (
        <EnglishLessonCard />
      ) : (
        <EmptyState
          icon={Heart}
          title={t("noFavorites")}
          text={t("noFavoritesText")}
        >
          <Button
            nativeButton={false}
            render={<Link href="/" />}
            variant="secondary"
            className="mt-5"
          >
            {d("discover")}
          </Button>
        </EmptyState>
      )}
    </main>
  );
}
