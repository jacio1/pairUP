"use client";
import { Target, Clock3, BookOpen } from "lucide-react";
import { useTranslations } from "next-intl";
import type { StudyProfile } from "@/lib/local-data";
export function ProfileAbout({ profile }: { profile: StudyProfile }) {
  const t = useTranslations("SocialProfile"),
    p = useTranslations("Product");
  const interests = profile.interests
    .split(/[,;\n]/)
    .map((value) => value.trim())
    .filter(Boolean);
  return (
    <section className="rounded-2xl border bg-card p-5 sm:p-6">
      <h2 className="mb-5 text-base font-semibold">{t("about")}</h2>
      <div className="space-y-5">
        <div>
          <h3 className="mb-2 flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <BookOpen className="size-4 text-primary" />
            {p("interests")}
          </h3>
          {interests.length ? (
            <div className="flex flex-wrap gap-2">
              {interests.map((interest, index) => (
                <span
                  key={index}
                  className="max-w-full rounded-lg bg-secondary px-2.5 py-1 text-xs leading-5 text-secondary-foreground wrap-anywhere"
                >
                  {interest}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">{t("notSpecified")}</p>
          )}
        </div>
        {[
          { key: "goal", value: profile.goal, icon: Target },
          { key: "schedule", value: profile.availability, icon: Clock3 },
        ].map(({ key, value, icon: Icon }) => (
          <div key={key}>
            <h3 className="mb-2 flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <Icon className="size-4 text-primary" />
              {p(key)}
            </h3>
            <p className="whitespace-pre-wrap text-sm leading-6 wrap-anywhere">
              {value || t("notSpecified")}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
