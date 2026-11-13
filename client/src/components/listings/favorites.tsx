"use client";
import { EmptyState } from "@/components/empty-state";
import { EnglishLessonCard } from "@/components/listings/english-lesson-card";
import { Button } from "@/components/ui/button";
import { useBrowserStorage } from "@/lib/browser-storage";
import { Heart } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
export function Favorites() {
  const t = useTranslations("Product");
  const d = useTranslations("Demo");
  const [favorite] = useBrowserStorage("pairup.favorite.demo-listing", false);
  return (
    <main className="page max-w-[1270px] w-full mx-auto p-[37px_48px_35px] flex-1 max-[1200px]:p-[30px] max-[1000px]:p-[26px] max-[760px]:p-[25px_20px] max-[480px]:p-[23px_17px]">
      <div className="page-heading flex justify-between items-center mb-[26px] gap-4 [&_h1]:text-[29px] [&_h1]:font-medium [&_h1]:tracking-[-1.2px] [&_h1]:leading-[1.4] [&_h1_>_span]:font-bold [&_p]:text-[12px] [&_p]:text-muted-foreground [&_p]:mt-[6px] [&_p]:leading-[1.7] max-[760px]:mb-[22px] max-[760px]:[&_h1]:text-[26px] max-[760px]:[&_p]:text-[11px] max-[480px]:[&_h1]:text-[23px] max-[480px]:[&_h1]:tracking-[-0.9px] max-[480px]:[&_h1]:leading-[1.4] max-[480px]:[&_p]:text-[10px] max-[760px]:[&_>_.primary-button]:text-[10px] max-[760px]:[&_>_.primary-button]:p-[9px] max-[760px]:[&_>_.primary-button]:gap-[5px]">
        <div>
          <h1>{t("favorites")}</h1>
          <p>{t("favoritesText")}</p>
        </div>
      </div>
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
            className="secondary-button min-h-10"
          >
            {d("discover")}
          </Button>
        </EmptyState>
      )}
    </main>
  );
}
