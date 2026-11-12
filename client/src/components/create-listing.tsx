"use client";

import { useRef, useState, type ReactNode, type SubmitEvent } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle2,
  Clock3,
  Loader2,
  MapPin,
  Monitor,
  Sparkles,
  Target,
  Users,
} from "lucide-react";
import {
  emptyListing,
  emptyProfile,
  listingLevels,
  listingSubjects,
  type ListingDraft,
} from "@/lib/local-data";
import { useBrowserStorage } from "@/lib/browser-storage";
import {
  actions,
  api,
  useCreateListingMutation,
  useLoginMutation,
} from "@/lib/store";
import { useAppDispatch, useAppSelector } from "./providers";
import { errorCode } from "./discover";
import { Alert, AlertDescription } from "./ui/alert";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Textarea } from "./ui/textarea";

type FieldErrors = Partial<Record<keyof ListingDraft, string>>;
const idFor = (key: keyof ListingDraft) =>
  key === "title" ? "listing-title" : key;

function FormField({
  id,
  label,
  hint,
  error,
  required,
  children,
}: {
  id: string;
  label: string;
  hint: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
}) {
  const t = useTranslations("Product");
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-sm font-medium">
        {label}
        {required && (
          <span className="text-primary" aria-label={t("requiredField")}>
            *
          </span>
        )}
      </Label>
      {children}
      <p
        id={`${id}-hint`}
        className="text-xs leading-relaxed text-muted-foreground"
      >
        {hint}
      </p>
      {error && (
        <p id={`${id}-error`} className="text-xs text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

function SectionHeader({
  number,
  icon: Icon,
  title,
  text,
}: {
  number: string;
  icon: typeof BookOpen;
  title: string;
  text: string;
}) {
  return (
    <CardHeader className="border-b border-border/60 pb-5">
      <div className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/8 text-primary">
          <Icon className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="mb-1 text-[10px] font-semibold tracking-widest text-muted-foreground">
            {number}
          </p>
          <CardTitle className="text-base">{title}</CardTitle>
          <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
            {text}
          </p>
        </div>
      </div>
    </CardHeader>
  );
}

export function CreateListing() {
  const t = useTranslations("Product");
  const errorsText = useTranslations("Errors");
  const router = useRouter();
  const dispatch = useAppDispatch();
  const session = useAppSelector((state) => state.chat.session);
  const [profile] = useBrowserStorage("pairup.study-profile", emptyProfile);
  const [draft, setDraft] = useState<ListingDraft>(emptyListing);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const requestId = useRef<string | null>(null);
  const inFlight = useRef(false);
  const [createListing] = useCreateListingMutation();
  const [login] = useLoginMutation();
  const formatOptions = [
    { value: "online", icon: Monitor },
    { value: "offline", icon: MapPin },
    { value: "hybrid", icon: Users },
  ];
  const needsLocation = draft.format !== "online";
  const completed = [
    draft.title.trim().length >= 5,
    !!draft.subject,
    !!draft.level,
    draft.goal.trim().length >= 5,
    draft.description.trim().length >= 10,
    !needsLocation || !!draft.location.trim(),
  ].filter(Boolean).length;

  function field(key: keyof ListingDraft, value: string) {
    setDraft((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
    setServerError("");
  }
  function fieldProps(key: keyof ListingDraft) {
    const id = idFor(key);
    return {
      id,
      name: key,
      "aria-invalid": !!errors[key],
      "aria-describedby": `${id}-hint${errors[key] ? ` ${id}-error` : ""}`,
    };
  }
  async function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (inFlight.current) return;
    const nextErrors: FieldErrors = {};
    if (draft.title.trim().length < 5) nextErrors.title = t("titleTooShort");
    if (!draft.subject) nextErrors.subject = t("subjectRequired");
    if (!draft.level) nextErrors.level = t("levelRequired");
    if (draft.goal.trim().length < 5) nextErrors.goal = t("goalTooShort");
    if (draft.description.trim().length < 10)
      nextErrors.description = t("descriptionTooShort");
    if (needsLocation && !draft.location.trim())
      nextErrors.location = t("locationRequired");
    setErrors(nextErrors);
    const first = Object.keys(nextErrors)[0] as keyof ListingDraft | undefined;
    if (first) {
      document.getElementById(idFor(first))?.focus();
      return;
    }
    inFlight.current = true;
    setSubmitting(true);
    setServerError("");
    try {
      let currentSession = session;
      if (!currentSession) {
        currentSession = await login({}).unwrap();
        dispatch(api.util.upsertQueryData("me", undefined, currentSession));
        dispatch(actions.session(currentSession));
      }
      requestId.current ??= crypto.randomUUID();
      const listing = await createListing({
        ...draft,
        id: requestId.current,
        location: needsLocation ? draft.location : "",
        authorName: profile.name.trim().slice(0, 60) || currentSession.name,
      }).unwrap();
      router.push(`/my-listings?published=${listing.id}`);
    } catch (error) {
      setServerError(errorCode(error));
      inFlight.current = false;
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-8 md:px-8 lg:py-10">
      <div className="mb-8 max-w-2xl">
        <Badge
          variant="secondary"
          className="mb-4 gap-1.5 bg-primary/8 px-2.5 py-1 text-primary"
        >
          <Sparkles className="size-3" />
          {t("createEyebrow")}
        </Badge>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          {t("create")}
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          {t("createText")}
        </p>
      </div>
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
        <form onSubmit={submit} noValidate className="min-w-0 space-y-5">
          <fieldset
            disabled={submitting}
            className="min-w-0 space-y-5 disabled:opacity-70"
          >
            <legend className="sr-only">{t("create")}</legend>
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
                    onValueChange={(value) => {
                      field("format", String(value));
                      setErrors((current) => ({
                        ...current,
                        location: undefined,
                      }));
                    }}
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
                <div
                  className={`grid gap-6 ${needsLocation ? "sm:grid-cols-2" : ""}`}
                >
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
                    className="min-h-36 resize-y leading-6"
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
      </div>
    </main>
  );
}
