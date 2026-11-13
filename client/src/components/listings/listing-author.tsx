"use client";
import { ProfileAvatar } from "@/components/profile/profile-avatar";
import type { Listing } from "@/lib/local-data";
import { useFormatter } from "next-intl";
import Link from "next/link";
export function ListingAuthor({
  listing,
  showDate = true,
}: {
  listing: Listing;
  showDate?: boolean;
}) {
  const format = useFormatter();
  const author = listing.authorProfile;
  const name = author?.name || listing.authorName;
  const id = author?.id || listing.authorProfileId;
  const content = (
    <>
      <ProfileAvatar
        name={name}
        color={author?.avatar}
        className="size-8 text-xs"
      />
      <span className="min-w-0">
        <span className="block truncate font-medium">{name}</span>
        {showDate && (
          <time
            dateTime={listing.createdAt}
            className="mt-0.5 block text-[11px] text-muted-foreground"
          >
            {format.dateTime(new Date(listing.createdAt), {
              day: "numeric",
              month: "short",
            })}
          </time>
        )}
      </span>
    </>
  );
  const className =
    "flex min-w-0 items-center gap-2.5 rounded-lg text-xs outline-none hover:text-primary focus-visible:ring-2 focus-visible:ring-ring";
  return id ? (
    <Link href={`/users/${id}`} className={className}>
      {content}
    </Link>
  ) : (
    <div className={className}>{content}</div>
  );
}
