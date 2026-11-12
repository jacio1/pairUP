"use client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { listingLevels, listingSubjects } from "@/lib/local-data";
import { BookOpen } from "lucide-react";
import { useTranslations } from "next-intl";
import { FormField } from "./form-field";
import { SectionHeader } from "./section-header";
import type { ListingForm } from "./use-listing-form";
export function ListingBasicsSection({
  form,
}: {
  form: Pick<ListingForm, "draft" | "errors" | "field" | "fieldProps">;
}) {
  const t = useTranslations("Product");
  const { draft, errors, field, fieldProps } = form;
  return (
    <Card className="gap-5 rounded-2xl shadow-none">
      <SectionHeader
        number="01"
        icon={BookOpen}
        title={t("aboutListing")}
        text={t("aboutListingHint")}
      />
      <CardContent className="space-y-6">
        <FormField
          id="listing-title"
          label={t("title")}
          hint={t("titlePlaceholder")}
          error={errors.title}
          required
        >
          <Input
            {...fieldProps("title")}
            className="h-11"
            value={draft.title}
            maxLength={150}
            required
            onChange={(e) => field("title", e.target.value)}
          />
        </FormField>
        <div className="grid gap-6 sm:grid-cols-2">
          {[
            {
              key: "subject" as const,
              options: listingSubjects,
              hint: "subjectHint",
              placeholder: "selectSubject",
            },
            {
              key: "level" as const,
              options: listingLevels,
              hint: "levelHint",
              placeholder: "selectLevel",
            },
          ].map(({ key, options, hint, placeholder }) => (
            <FormField
              key={key}
              id={key}
              label={t(key)}
              hint={t(hint)}
              error={errors[key]}
              required
            >
              <Select
                value={draft[key] || null}
                onValueChange={(value) => field(key, value ?? "")}
                items={Object.fromEntries(
                  options.map((value) => [value, t(value)]),
                )}
              >
                <SelectTrigger
                  {...fieldProps(key)}
                  className="h-11 w-full"
                  aria-required="true"
                >
                  <SelectValue placeholder={t(placeholder)} />
                </SelectTrigger>
                <SelectContent>
                  {options.map((value) => (
                    <SelectItem key={value} value={value}>
                      {t(value)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          ))}
        </div>
        <FormField
          id="goal"
          label={t("goal")}
          hint={t("goalPlaceholder")}
          error={errors.goal}
          required
        >
          <Input
            {...fieldProps("goal")}
            className="h-11"
            value={draft.goal}
            maxLength={300}
            required
            onChange={(e) => field("goal", e.target.value)}
          />
        </FormField>
      </CardContent>
    </Card>
  );
}
