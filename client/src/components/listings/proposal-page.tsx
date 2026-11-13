"use client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { listingHref } from "@/lib/local-data";
import { useProposalsQuery, useRespondMutation } from "@/lib/store";
import { BookOpen } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import Link from "next/link";
import { useState } from "react";
import { PageHeading } from "@/components/layout/page-heading";
export function ProposalPage({
  mode,
}: {
  mode: "messages" | "notifications" | "sessions";
}) {
  const t = useTranslations("Flow");
  const p = useTranslations("Product");
  const d = useTranslations("Demo");
  const a = useTranslations("Auth");
  const format = useFormatter();
  const {
    data = [],
    isLoading,
    isError,
  } = useProposalsQuery(undefined, { pollingInterval: 15000 });
  const [respond, { isLoading: busy }] = useRespondMutation();
  const [error, setError] = useState(false);
  const filtered =
    mode === "notifications"
      ? data
      : data.filter((item) => item.status === "accepted");
  // One session card per listing, even when its author accepts several proposals.
  const rows =
    mode === "notifications"
      ? filtered
      : filtered.filter(
          (row, index) =>
            filtered.findIndex((other) => other.listingId === row.listingId) ===
            index,
        );
  async function answer(id: string, accept: boolean) {
    setError(false);
    try {
      await respond({ id, accept }).unwrap();
    } catch {
      setError(true);
    }
  }
  return (
    <main className="page-shell space-y-6">
      <PageHeading title={mode === "messages" ? d("messages") : p(mode)} />
      {isLoading ? (
        <p>{a("loading")}</p>
      ) : isError ? (
        <p role="alert">{t("error")}</p>
      ) : rows.length ? (
        <div className="space-y-3">
          {rows.map((row) => (
            <Card
              key={row.id}
              className="max-w-4xl gap-4 rounded-2xl p-5 sm:p-6"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Link
                  href={listingHref(row.listing)}
                  className="font-semibold hover:text-primary"
                >
                  {row.listing?.title}
                </Link>
                <Badge variant="secondary">{t(row.status)}</Badge>
              </div>
              {mode === "notifications" && (
                <p className="text-sm text-muted-foreground">
                  {row.incoming
                    ? t("request", { name: row.senderName })
                    : t("sent")}
                </p>
              )}
              <time className="text-xs text-muted-foreground">
                {format.dateTime(new Date(row.createdAt), {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </time>
              <div className="flex flex-wrap gap-2">
                {row.status === "pending" && row.incoming && (
                  <>
                    <Button
                      disabled={busy}
                      onClick={() => void answer(row.id, true)}
                    >
                      {t("accept")}
                    </Button>
                    <Button
                      disabled={busy}
                      variant="outline"
                      onClick={() => void answer(row.id, false)}
                    >
                      {t("decline")}
                    </Button>
                  </>
                )}
                {row.status === "accepted" && (
                  <Button
                    nativeButton={false}
                    render={<Link href={`/messages/${row.listing.roomId}`} />}
                  >
                    {t("open")}
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="items-center p-10 text-center">
          <BookOpen className="size-10 text-primary" />
          <h2 className="text-xl font-semibold">{t("empty")}</h2>
          <p className="text-muted-foreground">{t("emptyText")}</p>
          <Button nativeButton={false} render={<Link href="/" />}>
            {d("discover")}
          </Button>
        </Card>
      )}
      {error && (
        <p role="alert" className="text-destructive">
          {t("error")}
        </p>
      )}
    </main>
  );
}
