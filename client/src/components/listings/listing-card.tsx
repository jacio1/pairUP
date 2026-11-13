"use client";
import { useAuth } from "@/components/auth/auth-context";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAppSelector } from "@/lib/hooks";
import { listingHref, type Listing } from "@/lib/local-data";
import { MessageCircle, BookOpen, Clock3, MapPin, Target } from "lucide-react";
import type { CSSProperties } from "react";
import { useTranslations } from "next-intl";
import { ListingAuthor } from "./listing-author";
import Link from "next/link";
import { useRouter } from "next/navigation";

const subjectTones: Record<string, string> = {
  english:
    "bg-violet-100/70 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300",
  russian:
    "bg-violet-100/70 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300",
  math: "bg-blue-100/70 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
  computerScience:
    "bg-teal-100/70 text-teal-700 dark:bg-teal-500/15 dark:text-teal-300",
  physics: "bg-sky-100/70 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300",
  biology:
    "bg-emerald-100/70 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
};
const courseColors: Record<string, string> = {
  english: "#A38AD5",
  russian: "#A38AD5",
  math: "#7398CF",
  computerScience: "#5DA6A0",
  physics: "#6DA9C1",
  biology: "#76A68B",
};
export function ListingCard({
  listing,
  action,
}: {
  listing: Listing;
  action?: React.ReactNode;
}) {
  const t = useTranslations("Product");
  const chatLabel = useTranslations("Flow");
  const open = useAuth();
  const router = useRouter();
  const session = useAppSelector((s) => s.chat.session);
  const english = listing.id === "demo-listing";
  const tone =
    subjectTones[listing.subject] ||
    "bg-amber-100/70 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300";
  return (
    <Card
      className="listing-card h-[340px] min-w-0 gap-0 border border-border bg-card py-0 ring-0 hover:border-primary/40 sm:h-[352px]"
      style={
        {
          "--course-color": courseColors[listing.subject] || "#D6A46B",
        } as CSSProperties
      }
      role="article"
    >
      <CardContent className="flex min-h-0 flex-1 flex-col gap-0 p-4 sm:p-5">
        <div className="min-h-0 flex-1 overflow-hidden">
          <div className="mb-4 flex items-center gap-3">
            <span
              aria-hidden="true"
              className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${tone}`}
            >
              <BookOpen className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <span className="block truncate text-[13px] font-bold text-foreground">
                {t(listing.subject)}
              </span>
              <span className="mt-0.5 block text-xs text-muted-foreground">
                {t(listing.level)}
              </span>
            </div>
            <Badge
              variant="outline"
              className="shrink-0 border-border bg-background/60 font-medium text-muted-foreground"
            >
              {t(listing.format)}
            </Badge>
          </div>
          <Link
            href={listingHref(listing)}
            className="block truncate text-lg font-semibold tracking-tight hover:text-primary sm:text-xl"
            title={listing.title}
          >
            {listing.title}
          </Link>
          <p className="mt-1.5 line-clamp-2 text-sm leading-6 text-muted-foreground wrap-anywhere">
            {listing.description}
          </p>
          {!english && listing.goal && (
            <div className="mt-3 flex items-start gap-2 rounded-lg bg-muted/65 px-3 py-2 text-xs leading-5">
              <Target
                aria-hidden="true"
                className="mt-0.5 size-3.5 shrink-0 text-primary"
              />
              <p className="truncate" title={listing.goal}>
                <span className="text-muted-foreground">{t("goal")}: </span>
                {listing.goal}
              </p>
            </div>
          )}
          {(listing.schedule || listing.location) && (
            <div className="mt-2 flex gap-3 overflow-hidden text-xs text-muted-foreground">
              {listing.schedule && (
                <span
                  className="flex min-w-0 items-center gap-1.5"
                  title={listing.schedule}
                >
                  <Clock3 className="size-3 shrink-0" />
                  <span className="truncate">{listing.schedule}</span>
                </span>
              )}
              {listing.location && (
                <span
                  className="flex min-w-0 items-center gap-1.5"
                  title={listing.location}
                >
                  <MapPin className="size-3 shrink-0" />
                  <span className="truncate">{listing.location}</span>
                </span>
              )}
            </div>
          )}
        </div>
        <div className="shrink-0 pt-3">
          <div className="flex items-center justify-between gap-2 border-t pt-3">
            <ListingAuthor listing={listing} />
            {english ? (
              <Button
                size="sm"
                className="h-8 shrink-0 text-xs"
                onClick={() =>
                  session ? router.push(`/messages/${listing.roomId}`) : open()
                }
              >
                {chatLabel("goChat")}
                <MessageCircle className="size-3.5" />
              </Button>
            ) : (
              action || (
                <Button
                  variant="secondary"
                  size="sm"
                  className="shrink-0 text-xs"
                  nativeButton={false}
                  render={<Link href={listingHref(listing)} />}
                >
                  {t("listingDetails")}
                </Button>
              )
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
