"use client";
import { useAuth } from "@/components/auth/auth-context";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAppSelector } from "@/lib/hooks";
import { listingHref, listingSlug } from "@/lib/local-data";
import {
  useListingsQuery,
  useProposalsQuery,
  useProposeMutation,
} from "@/lib/store";
import { Clock3, MapPin, Target } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
export function ListingDetails({ id }: { id: string }) {
  const t = useTranslations("Product");
  const f = useTranslations("Flow");
  const chatLabel = useTranslations("Flow");
  const a = useTranslations("Auth");
  const { data, isLoading } = useListingsQuery();
  const session = useAppSelector((s) => s.chat.session);
  const { data: proposals = [] } = useProposalsQuery(undefined, {
    skip: !session,
  });
  const [propose, { isLoading: sending }] = useProposeMutation();
  const [error, setError] = useState(false);
  const open = useAuth();
  const router = useRouter();
  const listing = data?.find((l) => l.id === id || listingSlug(l) === id);
  useEffect(() => {
    if (listing && id !== listingSlug(listing))
      router.replace(listingHref(listing));
  }, [listing, id, router]);
  const proposal = proposals.find(
    (p) => p.listingId === listing?.id && !p.incoming,
  );
  if (isLoading) return <main className="p-10">{a("loading")}</main>;
  if (!listing)
    return (
      <main className="p-10">
        <p>{t("noListings")}</p>
        <Link href="/">← PairUp</Link>
      </main>
    );
  const own =
    listing.ownerSessionId === session?.id ||
    (listing.id === "demo-listing" && session?.role === "presenter");
  return (
    <main className="mx-auto w-full max-w-3xl space-y-6 px-5 py-10">
      <Link href="/" className="text-sm text-muted-foreground">
        ← {f("details")}
      </Link>
      <Card className="p-6 sm:p-8">
        <div className="flex flex-wrap gap-2">
          <Badge>{t(listing.subject)}</Badge>
          <Badge variant="secondary">{t(listing.level)}</Badge>
          <Badge variant="outline">{t(listing.format)}</Badge>
        </div>
        <h1 className="text-3xl font-semibold wrap-anywhere">
          {listing.title}
        </h1>
        <p className="text-sm text-muted-foreground">
          {f("author", { name: listing.authorName })}
        </p>
        <p className="flex gap-2 font-medium">
          <Target className="size-5 shrink-0 text-primary" />
          {listing.goal}
        </p>
        <p className="whitespace-pre-wrap leading-7 wrap-anywhere">
          {listing.description}
        </p>
        {listing.schedule && (
          <p className="flex gap-2 text-sm">
            <Clock3 className="size-4" />
            {listing.schedule}
          </p>
        )}
        {listing.location && (
          <p className="flex gap-2 text-sm">
            <MapPin className="size-4" />
            {listing.location}
          </p>
        )}
        {listing.id === "demo-listing" ? (
          <Button
            onClick={() =>
              session ? router.push(`/messages/${listing.roomId}`) : open()
            }
          >
            {chatLabel("goChat")}
          </Button>
        ) : own || proposal?.status === "accepted" ? (
          <Button
            nativeButton={false}
            render={<Link href={`/messages/${listing.roomId}`} />}
          >
            {f("open")}
          </Button>
        ) : (
          <Button
            disabled={sending || !!proposal}
            onClick={async () => {
              if (!session) {
                open();
                return;
              }
              setError(false);
              try {
                await propose(listing.id).unwrap();
              } catch {
                setError(true);
              }
            }}
          >
            {proposal ? f(proposal.status) : f("propose")}
          </Button>
        )}
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {f("error")}
          </p>
        )}
      </Card>
    </main>
  );
}
