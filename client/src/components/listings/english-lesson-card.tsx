"use client";
import { ListingCard } from "@/components/listings/listing-card";
import { useListingsQuery } from "@/lib/api";
export function EnglishLessonCard() {
  const { data } = useListingsQuery();
  const listing = data?.find((item) => item.id === "demo-listing");
  return listing ? <ListingCard listing={listing} /> : null;
}
