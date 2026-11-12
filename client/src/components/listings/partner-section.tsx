"use client";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Users } from "lucide-react";
import { useTranslations } from "next-intl";
import { FormField } from "./form-field";
import { SectionHeader } from "./section-header";
import type { ListingForm } from "./use-listing-form";
export function PartnerSection({
  form,
}: {
  form: Pick<ListingForm, "draft" | "errors" | "field" | "fieldProps">;
}) {
  const t = useTranslations("Product");
  const { draft, errors, field, fieldProps } = form;
  return (
    <Card className="gap-5 rounded-2xl shadow-none">
      <SectionHeader
        number="03"
        icon={Users}
        title={t("aboutPartner")}
        text={t("partnerHint")}
      />
      <CardContent>
        <FormField
          id="description"
          label={t("descriptionLabel")}
          hint={t("descriptionPlaceholder")}
          error={errors.description}
          required
        >
          <Textarea
            {...fieldProps("description")}
            className="min-h-36 resize-none leading-6"
            value={draft.description}
            maxLength={2000}
            required
            onChange={(e) => field("description", e.target.value)}
          />
        </FormField>
        <p className="mt-2 text-right text-[11px] tabular-nums text-muted-foreground">
          {draft.description.length} / 2000
        </p>
      </CardContent>
    </Card>
  );
}
