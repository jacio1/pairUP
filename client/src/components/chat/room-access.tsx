"use client";
import { ChatRoom } from "@/components/chat/chat-room";
import { Button } from "@/components/ui/button";
import { useAppSelector } from "@/lib/hooks";
import { listingHref } from "@/lib/local-data";
import { useListingsQuery, useProposalsQuery } from "@/lib/store";
import { useTranslations } from "next-intl";
import Link from "next/link";
export function RoomAccess({ roomId }: { roomId: string }) {
  const session = useAppSelector((s) => s.chat.session);
  const { data: listings, isLoading } = useListingsQuery();
  const { data: proposals = [], isLoading: proposalsLoading } =
    useProposalsQuery();
  const t = useTranslations("Flow");
  const a = useTranslations("Auth");
  const d = useTranslations("Demo");
  const listing = listings?.find((l) => l.roomId === roomId);
  const allowed =
    listing &&
    (listing.id === "demo-listing" ||
      listing.ownerSessionId === session?.id ||
      (listing.id === "demo-listing" && session?.role === "presenter") ||
      proposals.some(
        (p) => p.listingId === listing.id && p.status === "accepted",
      ));
  if (isLoading || proposalsLoading)
    return <div className="p-10">{a("loading")}</div>;
  if (!allowed)
    return (
      <main className="flex h-dvh flex-col items-center justify-center gap-5 p-6 text-center">
        <h1 className="text-2xl font-semibold">{t("pending")}</h1>
        <Button
          nativeButton={false}
          render={<Link href={listing ? listingHref(listing) : "/"} />}
        >
          {d("backDiscover")}
        </Button>
      </main>
    );
  return <ChatRoom key={roomId} roomId={roomId} />;
}
