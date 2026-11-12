"use client";
import { ListingList } from "@/components/listings/listing-list";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { SearchFilters } from "./search-filters";
export function Discover() {
  const t = useTranslations("Demo");
  const p = useTranslations("Product");
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-8 md:px-8">
      <section className="page-heading flex justify-between items-center mb-[26px] gap-4 [&_h1]:text-[29px] [&_h1]:font-medium [&_h1]:tracking-[-1.2px] [&_h1]:leading-[1.4] [&_h1_>_span]:font-bold [&_p]:text-[12px] [&_p]:text-muted-foreground [&_p]:mt-[6px] [&_p]:leading-[1.7] max-[760px]:mb-[22px] max-[760px]:[&_h1]:text-[26px] max-[760px]:[&_p]:text-[11px] max-[480px]:[&_h1]:text-[23px] max-[480px]:[&_h1]:tracking-[-0.9px] max-[480px]:[&_h1]:leading-[1.4] max-[480px]:[&_p]:text-[10px] max-[760px]:[&_>_.primary-button]:text-[10px] max-[760px]:[&_>_.primary-button]:p-[9px] max-[760px]:[&_>_.primary-button]:gap-[5px]">
        <div>
          <div className="eyebrow flex gap-[7px] items-center tracking-[1.5px] text-[9px] font-semibold text-muted-foreground mb-[10px] [&_.online-dot]:w-[5px] [&_.online-dot]:h-[5px] max-[480px]:text-[8px]">
            <span className="online-dot w-[6px] h-[6px] bg-sidebar-primary rounded-full inline-block shrink-0" />
            {t("newWay")}
          </div>
          <h1>{p("discoverTitle")}</h1>
          <p>{t("welcomeText")}</p>
        </div>
        <span className="heading-note flex items-center gap-[6px] text-muted-foreground text-[10px] whitespace-nowrap [&_svg]:text-primary max-[1200px]:hidden">
          <Button
            className="secondary-button min-h-10"
            nativeButton={false}
            render={<Link href="/create" />}
            variant="secondary"
          >
            <PlusCircle size={16} />
            {p("create")}
          </Button>
        </span>
      </section>
      <SearchFilters />
      <section aria-label={p("discoverTitle")} className="space-y-3">
        <ListingList />
      </section>
    </main>
  );
}
