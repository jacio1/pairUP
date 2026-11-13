"use client";
import { useAuth } from "@/components/auth/auth-context";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAppSelector } from "@/lib/hooks";
import { listingHref, type Listing } from "@/lib/local-data";
import {
  ArrowUpRight,
  BookOpen,
  Clock3,
  MapPin,
  UserRound,
} from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
export function ListingCard({
  listing,
  action,
}: {
  listing: Listing;
  action?: React.ReactNode;
}) {
  const t = useTranslations("Product");
  const f = useFormatter();
  const chatLabel = useTranslations("Flow");
  const open = useAuth();
  const router = useRouter();
  const session = useAppSelector((s) => s.chat.session);
  const english = listing.id === "demo-listing";
  return (
    <Card className="min-w-0 gap-0 rounded-xl py-0 shadow-none" role="article">
      <CardContent className="gap-0 p-3 sm:p-4">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <Badge variant="secondary">
            <BookOpen className="size-3" />
            {t(listing.subject)}
          </Badge>
          <Badge variant="outline">{t(listing.level)}</Badge>
          <span className="ml-auto text-xs text-muted-foreground">
            {t(listing.format)}
          </span>
        </div>
        <Link
          href={listingHref(listing)}
          className="block text-base font-semibold hover:text-primary wrap-anywhere"
        >
          {listing.title}
        </Link>
        <p className="mt-1 line-clamp-1 text-sm leading-5 text-muted-foreground">
          {listing.description}
        </p>
        {(listing.schedule || listing.location) && (
          <div className="my-2 flex flex-wrap gap-4 text-xs text-muted-foreground">
            {listing.schedule && (
              <span className="flex items-center gap-1">
                <Clock3 className="size-3" />
                {listing.schedule}
              </span>
            )}
            {listing.location && (
              <span className="flex items-center gap-1">
                <MapPin className="size-3" />
                {listing.location}
              </span>
            )}
          </div>
        )}
        <div className="mt-2 flex items-center justify-between gap-3 border-t pt-2">
          <span className="flex min-w-0 items-center gap-2 text-xs">
            <Avatar size="sm">
              <AvatarFallback>
                <UserRound className="size-3" />
              </AvatarFallback>
            </Avatar>
            <span className="truncate">{listing.authorName}</span>
          </span>
          {english ? (
            <Button
              size="sm"
              className="h-8 text-xs"
              onClick={() =>
                session ? router.push(`/messages/${listing.roomId}`) : open()
              }
            >
              {chatLabel("goChat")}
              <ArrowUpRight className="size-3.5" />
            </Button>
          ) : (
            action || (
              <Button
                variant="ghost"
                size="sm"
                nativeButton={false}
                render={<Link href={listingHref(listing)} />}
              >
                {t("listingDetails")}
                <ArrowUpRight className="size-4" />
              </Button>
            )
          )}
          <time className="hidden text-xs text-muted-foreground sm:block">
            {f.dateTime(new Date(listing.createdAt), {
              day: "numeric",
              month: "short",
            })}
          </time>
        </div>
      </CardContent>
    </Card>
  );
}
