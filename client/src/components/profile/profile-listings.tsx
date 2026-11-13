"use client";
import { ListingCard } from "@/components/listings/listing-card";
import { FileText } from "lucide-react";
import { useTranslations } from "next-intl";
import type { Listing } from "@/lib/local-data";
export function ProfileListings({ listings }: { listings: Listing[] }) {
  const t = useTranslations("SocialProfile");
  return (
    <section className="min-w-0 space-y-4">
      <h2 className="text-lg font-semibold">{t("listings")}</h2>
      {listings.length ? (
        <div className="grid gap-4 xl:grid-cols-2">
          {listings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed bg-card/50 p-8 text-center">
          <FileText className="mx-auto mb-3 size-7 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">{t("noListings")}</p>
        </div>
      )}
    </section>
  );
}
