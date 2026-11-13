"use client";
import { EmptyState } from "@/components/empty-state";
import { ListingList } from "@/components/listings/listing-list";
import { Button } from "@/components/ui/button";
import { FileText, PlusCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
export function MyListings({ publishedId }: { publishedId?: string }) {
  const t = useTranslations("Product");
  return (
    <main className="page max-w-[1270px] w-full mx-auto p-[37px_48px_35px] flex-1 max-[1200px]:p-[30px] max-[1000px]:p-[26px] max-[760px]:p-[25px_20px] max-[480px]:p-[23px_17px]">
      <div className="page-heading flex justify-between items-center mb-[26px] gap-4 [&_h1]:text-[29px] [&_h1]:font-medium [&_h1]:tracking-[-1.2px] [&_h1]:leading-[1.4] [&_h1_>_span]:font-bold [&_p]:text-[12px] [&_p]:text-muted-foreground [&_p]:mt-[6px] [&_p]:leading-[1.7] max-[760px]:mb-[22px] max-[760px]:[&_h1]:text-[26px] max-[760px]:[&_p]:text-[11px] max-[480px]:[&_h1]:text-[23px] max-[480px]:[&_h1]:tracking-[-0.9px] max-[480px]:[&_h1]:leading-[1.4] max-[480px]:[&_p]:text-[10px] max-[760px]:[&_>_.primary-button]:text-[10px] max-[760px]:[&_>_.primary-button]:p-[9px] max-[760px]:[&_>_.primary-button]:gap-[5px]">
        <div>
          <h1>{t("myListings")}</h1>
          <p>{t("myListingsText")}</p>
        </div>
        <Button
          nativeButton={false}
          render={<Link href="/create" />}
          variant="default"
          className="primary-button min-h-10"
        >
          <PlusCircle size={16} />
          {t("create")}
        </Button>
      </div>
      <ListingList
        mine
        publishedId={publishedId}
        empty={
          <EmptyState
            icon={FileText}
            title={t("noListings")}
            text={t("noListingsText")}
          >
            <Button
              nativeButton={false}
              render={<Link href="/create" />}
              variant="secondary"
              className="secondary-button min-h-10"
            >
              {t("create")}
            </Button>
          </EmptyState>
        }
      />
    </main>
  );
}
