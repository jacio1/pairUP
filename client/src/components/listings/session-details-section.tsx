"use client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Clock3, MapPin, Monitor, Users } from "lucide-react";
import { useTranslations } from "next-intl";
import { FormField } from "./form-field";
import { SectionHeader } from "./section-header";
import type { ListingForm } from "./use-listing-form";
export function SessionDetailsSection({
  form,
}: {
  form: Pick<
    ListingForm,
    | "draft"
    | "errors"
    | "field"
    | "fieldProps"
    | "needsLocation"
    | "changeFormat"
  >;
}) {
  const t = useTranslations("Product");
  const { draft, errors, field, fieldProps, needsLocation, changeFormat } =
    form;
  const formatOptions = [
    { value: "online", icon: Monitor },
    { value: "offline", icon: MapPin },
    { value: "hybrid", icon: Users },
  ];
  return (
    <Card className="gap-5 rounded-2xl shadow-none">
      <SectionHeader
        number="02"
        icon={Clock3}
        title={t("sessionDetails")}
        text={t("sessionDetailsHint")}
      />
      <CardContent className="space-y-6">
        <div>
          <Label id="format-label" className="mb-3 text-sm">
            {t("format")}
          </Label>
          <RadioGroup
            value={draft.format}
            onValueChange={(value) => changeFormat(String(value))}
            aria-labelledby="format-label"
            className="grid grid-cols-1 gap-2 sm:grid-cols-3"
          >
            {formatOptions.map(({ value, icon: Icon }) => (
              <Label
                key={value}
                className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-input p-3 text-sm font-normal transition-colors hover:bg-muted/50 has-[[data-checked]]:border-primary has-[[data-checked]]:bg-primary/5 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring"
              >
                <RadioGroupItem value={value} />
                <Icon className="size-4 text-muted-foreground" />
                {t(value)}
              </Label>
            ))}
          </RadioGroup>
        </div>
        <div className={`grid gap-6 ${needsLocation ? "sm:grid-cols-2" : ""}`}>
          <FormField
            id="schedule"
            label={t("schedule")}
            hint={t("schedulePlaceholder")}
          >
            <Input
              {...fieldProps("schedule")}
              className="h-11"
              value={draft.schedule}
              maxLength={200}
              onChange={(e) => field("schedule", e.target.value)}
            />
          </FormField>
          {needsLocation && (
            <FormField
              id="location"
              label={t("location")}
              hint={t("locationPlaceholder")}
              error={errors.location}
              required
            >
              <Input
                {...fieldProps("location")}
                className="h-11"
                value={draft.location}
                maxLength={150}
                required
                onChange={(e) => field("location", e.target.value)}
              />
            </FormField>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
