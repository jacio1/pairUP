"use client";
import { ListingList } from "@/components/listings/listing-list";
import { useTranslations } from "next-intl";
import { SearchFilters } from "./search-filters";
import { DiscoverHero } from "./discover-hero";
export function Discover() {
  const p = useTranslations("Product");
  const design = useTranslations("Design");
  return (
    <main className="page-shell">
      <DiscoverHero />
      <SearchFilters />
      <section aria-label={p("discoverTitle")} className="space-y-3">
        <div className="mb-5 flex items-baseline justify-between gap-3">
          <h2 className="text-xl font-bold tracking-tight">
            {design("directory")}
          </h2>
          <span className="hidden text-xs text-muted-foreground sm:block">
            {design("directoryHint")}
          </span>
        </div>
        <ListingList />
      </section>
    </main>
  );
}
