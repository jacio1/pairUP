"use client";
import { ListingCard } from "@/components/listings/listing-card";
import { Button } from "@/components/ui/button";
import { useAppSelector } from "@/lib/hooks";
import { useListingsQuery } from "@/lib/store";
import { useTranslations } from "next-intl";
export function ListingList({
  mine = false,
  empty,
  publishedId,
}: {
  mine?: boolean;
  empty?: React.ReactNode;
  publishedId?: string;
}) {
  const session = useAppSelector((s) => s.chat.session);
  const t = useTranslations("Product");
  const a = useTranslations("Auth");
  const { data, isLoading, isError, refetch } = useListingsQuery(
    mine ? session?.id : undefined,
    { skip: mine && !session },
  );
  if (isLoading) return <p className="py-6">{a("loading")}</p>;
  if (isError)
    return (
      <div role="alert">
        {t("listingsLoadError")}{" "}
        <Button variant="outline" onClick={() => void refetch()}>
          {t("retryListings")}
        </Button>
      </div>
    );
  if (!data?.length) return empty || null;
  return (
    <div className="grid gap-3">
      {mine && data.some((l) => l.id === publishedId) && (
        <p role="status" className="rounded-xl border bg-primary/5 p-4 text-sm">
          {t("listingPublished")}
        </p>
      )}
      {[...data]
        .sort(
          (a, b) =>
            Number(b.id === "demo-listing") - Number(a.id === "demo-listing"),
        )
        .map((listing) => (
          <ListingCard key={listing.id} listing={listing} />
        ))}
    </div>
  );
}
