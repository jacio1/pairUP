"use client";

import { useFormatter, useTranslations } from "next-intl";
import {
  BookOpen,
  CheckCircle2,
  Clock3,
  Loader2,
  MapPin,
  Target,
  UserRound,
} from "lucide-react";
import { useListingsQuery, useMeQuery } from "@/lib/store";
import type { Listing } from "@/lib/local-data";
import { useAppSelector } from "./providers";
import { Alert, AlertDescription } from "./ui/alert";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

export function ListingCard({ listing }: { listing: Listing }) {
  const t = useTranslations("Product");
  const format = useFormatter();
  return (
    <Card className="min-w-0 gap-4 rounded-2xl shadow-none" role="article">
      <CardHeader className="gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="bg-primary/8 text-primary">
            <BookOpen className="size-3" />
            {t(listing.subject)}
          </Badge>
          <Badge variant="outline">{t(listing.level)}</Badge>
          <Badge variant="outline">{t(listing.format)}</Badge>
        </div>
        <CardTitle className="text-lg leading-relaxed wrap-anywhere">
          {listing.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="flex items-start gap-2 text-sm font-medium leading-relaxed wrap-anywhere">
          <Target className="mt-0.5 size-4 shrink-0 text-primary" />
          {listing.goal}
        </p>
        <p className="text-sm leading-6 whitespace-pre-wrap text-muted-foreground wrap-anywhere">
          {listing.description}
        </p>
        {(listing.schedule || listing.location) && (
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
            {listing.schedule && (
              <span className="flex items-start gap-2 wrap-anywhere">
                <Clock3 className="size-3.5 shrink-0" />
                {listing.schedule}
              </span>
            )}
            {listing.location && (
              <span className="flex items-start gap-2 wrap-anywhere">
                <MapPin className="size-3.5 shrink-0" />
                {listing.location}
              </span>
            )}
          </div>
        )}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
          <span className="flex min-w-0 items-center gap-2 text-xs">
            <Avatar size="sm">
              <AvatarFallback>
                <UserRound className="size-3.5" />
              </AvatarFallback>
            </Avatar>
            <span className="wrap-anywhere">{listing.authorName}</span>
          </span>
          <time
            className="text-[11px] text-muted-foreground"
            dateTime={listing.createdAt}
          >
            {format.dateTime(new Date(listing.createdAt), {
              day: "numeric",
              month: "short",
            })}
          </time>
        </div>
      </CardContent>
    </Card>
  );
}

export function ListingList({
  mine = false,
  empty,
  publishedId,
}: {
  mine?: boolean;
  empty?: React.ReactNode;
  publishedId?: string;
}) {
  const t = useTranslations("Product");
  const session = useAppSelector((state) => state.chat.session);
  const { isLoading: sessionLoading } = useMeQuery();
  const { data, isLoading, isError, refetch } = useListingsQuery(
    mine ? session?.id : undefined,
    { skip: mine && !session },
  );
  if (isLoading || (mine && sessionLoading))
    return (
      <div
        className="flex items-center gap-2 py-6 text-sm text-muted-foreground"
        role="status"
      >
        <Loader2 className="size-4 animate-spin" />
        {t("loadingListings")}
      </div>
    );
  if (isError)
    return (
      <Alert className="mb-5">
        <AlertDescription className="flex flex-wrap items-center justify-between gap-3">
          {t("listingsLoadError")}
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            {t("retryListings")}
          </Button>
        </AlertDescription>
      </Alert>
    );
  if (!data?.length) return empty ?? null;
  return (
    <div className="mb-6 grid gap-4">
      {mine && data.some((listing) => listing.id === publishedId) && (
        <Alert className="border-primary/20 bg-primary/5">
          <CheckCircle2 className="text-primary" />
          <AlertDescription>{t("listingPublished")}</AlertDescription>
        </Alert>
      )}
      {data.map((listing) => (
        <ListingCard key={listing.id} listing={listing} />
      ))}
    </div>
  );
}
