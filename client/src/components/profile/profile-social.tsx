"use client";
import { Button } from "@/components/ui/button";
import { SocialFeed } from "@/components/listings/social-feed";
import { useTranslations } from "next-intl";
import { useState } from "react";

export function ProfileSocial({ id }: { id: number }) {
  const t = useTranslations("Social");
  const [liked, setLiked] = useState(false);
  return (
    <div className="space-y-4">
      <div
        className="flex flex-wrap gap-2"
        role="group"
        aria-label={t("feeds")}
      >
        <Button
          type="button"
          variant={liked ? "outline" : "secondary"}
          aria-pressed={!liked}
          onClick={() => setLiked(false)}
        >
          {t("myPosts")}
        </Button>
        <Button
          type="button"
          variant={liked ? "secondary" : "outline"}
          aria-pressed={liked}
          onClick={() => setLiked(true)}
        >
          {t("liked")}
        </Button>
      </div>
      <SocialFeed key={String(liked)} author={id} liked={liked} />
    </div>
  );
}
