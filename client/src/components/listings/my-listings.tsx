"use client";
import { EmptyState } from "@/components/empty-state";
import { PageHeading } from "@/components/layout/page-heading";
import { ListingList } from "@/components/listings/listing-list";
import { Button } from "@/components/ui/button";
import { FileText, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
export function MyListings({ publishedId }: { publishedId?: string }) {
  const t = useTranslations("Product");
  return (
    <main className="page-shell">
      <PageHeading title={t("myListings")} description={t("myListingsText")}>
        <Button nativeButton={false} render={<Link href="/create" />}>
          <Plus className="size-4" />
          {t("create")}
        </Button>
      </PageHeading>
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
              className="mt-5"
            >
              {t("create")}
            </Button>
          </EmptyState>
        }
      />
    </main>
  );
}
