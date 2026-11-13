import { useBrowserStorage } from "@/lib/browser-storage";
import { errorCode } from "@/lib/errors";
import { useAppSelector } from "@/lib/hooks";
import {
  emptyListing,
  emptyProfile,
  type ListingDraft,
} from "@/lib/local-data";
import { useCreateListingMutation } from "@/lib/store";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useRef, useState, type SubmitEvent } from "react";
type FieldErrors = Partial<Record<keyof ListingDraft, string>>;
const idFor = (key: keyof ListingDraft) =>
  key === "title" ? "listing-title" : key;

export function useListingForm() {
  const t = useTranslations("Product");
  const router = useRouter();
  const session = useAppSelector((state) => state.chat.session);
  const [profile] = useBrowserStorage("pairup.study-profile", emptyProfile);
  const [draft, setDraft] = useState<ListingDraft>(emptyListing);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const requestId = useRef<string | null>(null);
  const inFlight = useRef(false);
  const [createListing] = useCreateListingMutation();
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
      if (!session) throw { data: { code: "UNAUTHORIZED" } };
      const currentSession = session;
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

  function changeFormat(value: string) {
    field("format", value);
    setErrors((current) => ({ ...current, location: undefined }));
  }
  return {
    draft,
    errors,
    serverError,
    submitting,
    needsLocation,
    completed,
    field,
    fieldProps,
    submit,
    changeFormat,
  };
}
export type ListingForm = ReturnType<typeof useListingForm>;
