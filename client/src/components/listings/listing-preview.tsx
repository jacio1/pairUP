"use client";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Clock3, MapPin, Monitor, Target } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ListingForm } from "./use-listing-form";
export function ListingPreview({
  form,
}: {
  form: Pick<ListingForm, "draft" | "needsLocation" | "completed">;
}) {
  const t = useTranslations("Product");
  const { draft, needsLocation, completed } = form;
  return (
    <aside className="space-y-4 xl:sticky xl:top-6">
      <Card className="gap-4 rounded-2xl border border-primary/15 bg-primary/3 shadow-none ring-0">
        <CardHeader>
          <p className="text-xs font-medium text-muted-foreground">
            {t("listingPreview")}
          </p>
          <CardTitle className="text-base leading-relaxed wrap-anywhere">
            {draft.title.trim() || t("previewTitle")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">
              {draft.subject ? t(draft.subject) : t("subject")}
            </Badge>
            <Badge variant="outline">
              {draft.level ? t(draft.level) : t("level")}
            </Badge>
          </div>
          <p className="flex items-start gap-2 text-sm leading-relaxed wrap-anywhere">
            <Target className="mt-1 size-4 shrink-0 text-primary" />
            {draft.goal.trim() || t("previewGoal")}
          </p>
          <div className="space-y-2 border-t border-border pt-4 text-xs text-muted-foreground">
            <p className="flex items-center gap-2">
              <Monitor className="size-3.5" />
              {t(draft.format)}
            </p>
            {draft.schedule.trim() && (
              <p className="flex items-start gap-2 wrap-anywhere">
                <Clock3 className="size-3.5 shrink-0" />
                {draft.schedule}
              </p>
            )}
            {needsLocation && draft.location.trim() && (
              <p className="flex items-start gap-2 wrap-anywhere">
                <MapPin className="size-3.5 shrink-0" />
                {draft.location}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
      <div className="rounded-2xl border border-border p-5">
        <div className="mb-3 flex items-center justify-between gap-2 text-xs">
          <span className="font-medium">{t("readyToPublish")}</span>
          <span className="text-muted-foreground">{completed}/6</span>
        </div>
        <div className="mb-4 flex gap-1" aria-hidden="true">
          {Array.from({ length: 6 }, (_, index) => (
            <div
              key={index}
              className={`h-1 flex-1 rounded-full ${index < completed ? "bg-primary" : "bg-muted"}`}
            />
          ))}
        </div>
        <p className="flex gap-2 text-xs leading-5 text-muted-foreground">
          <Check className="mt-0.5 size-4 shrink-0 text-primary" />
          {t("createTip")}
        </p>
      </div>
    </aside>
  );
}
