"use client";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { ListingBasicsSection } from "./listing-basics-section";
import { ListingPreview } from "./listing-preview";
import { PartnerSection } from "./partner-section";
import { SessionDetailsSection } from "./session-details-section";
import { useListingForm } from "./use-listing-form";
import { PageHeading } from "@/components/layout/page-heading";
export function CreateListing() {
  const t = useTranslations("Product");
  const errorsText = useTranslations("Errors");
  const form = useListingForm();
  const { submit, submitting, serverError } = form;
  return (
    <main className="page-shell">
      <PageHeading title={t("create")} description={t("createText")} />
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
        <form onSubmit={submit} noValidate className="min-w-0 space-y-5">
          <fieldset
            disabled={submitting}
            className="min-w-0 space-y-5 disabled:opacity-70"
          >
            <legend className="sr-only">{t("create")}</legend>
            <ListingBasicsSection form={form} />
            <SessionDetailsSection form={form} />
            <PartnerSection form={form} />
          </fieldset>
          {serverError && (
            <Alert variant="destructive">
              <AlertDescription>{errorsText(serverError)}</AlertDescription>
            </Alert>
          )}
          <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="flex items-start gap-2 text-xs leading-5 text-muted-foreground">
              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
              {t("publishHint")}
            </p>
            <Button
              type="submit"
              disabled={submitting}
              size="lg"
              className="h-11 shrink-0 px-6"
            >
              {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
              {t(submitting ? "publishing" : "publish")}{" "}
              {!submitting && <ArrowRight className="size-4" />}
            </Button>
          </div>
        </form>
        <ListingPreview form={form} />
      </div>
    </main>
  );
}
