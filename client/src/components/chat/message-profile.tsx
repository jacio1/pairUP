"use client";
import { useState, type ReactNode } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ProfileAvatar } from "@/components/profile/profile-avatar";
import { useProfileSummaryQuery } from "@/lib/profiles-api";
import type { Message } from "@/lib/store";
export function MessageProfile({
  message,
  children,
}: {
  message: Message;
  children?: ReactNode;
}) {
  const [open, setOpen] = useState(false),
    t = useTranslations("ChatExtras");
  const author = message.authorProfile;
  const { data, isFetching, isError, refetch } = useProfileSummaryQuery(
    String(author?.id),
    { skip: !open || !author },
  );
  if (!author) return <span>{children || message.author}</span>;
  return (
    <>
      <button
        type="button"
        className="rounded text-left hover:underline focus-visible:ring-2 focus-visible:ring-ring"
        aria-label={t("viewProfile", { name: message.author })}
        onClick={() => setOpen(true)}
      >
        {children || message.author}
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogTitle>{data?.name || author.name}</DialogTitle>
          <DialogDescription>{t("profilePreview")}</DialogDescription>
          <ProfileAvatar
            name={data?.name || author.name}
            color={data?.avatar || author.avatar}
            className="size-16 text-2xl"
          />
          {isFetching && !data && <p role="status">{t("loading")}</p>}
          {isError && (
            <Button variant="outline" onClick={() => void refetch()}>
              {t("retry")}
            </Button>
          )}
          {data && (
            <div className="space-y-4 text-sm">
              <p className="whitespace-pre-wrap text-muted-foreground">
                {data.bio}
              </p>
              {[data.interests, data.goal, data.availability]
                .filter(Boolean)
                .map((text, i) => (
                  <p
                    key={i}
                    className="rounded-xl bg-muted p-3 whitespace-pre-wrap"
                  >
                    {text}
                  </p>
                ))}
            </div>
          )}
          <Link
            href={`/users/${author.id}`}
            onClick={() => setOpen(false)}
            className="rounded-xl bg-primary px-4 py-3 text-center text-sm font-medium text-primary-foreground"
          >
            {t("fullProfile")}
          </Link>
        </DialogContent>
      </Dialog>
    </>
  );
}
