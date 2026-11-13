"use client";
import { Card } from "@/components/ui/card";
import { useTranslations } from "next-intl";
import type { ProfileForm } from "./use-profile-form";
export function ProfileSummary({
  form,
}: {
  form: Pick<ProfileForm, "profile">;
}) {
  const p = useTranslations("Product");
  const { profile } = form;
  return (
    <Card className="block gap-0 ring-0 shadow-none settings-card bg-card [border:1px_solid_var(--border)] rounded-[16px] p-[25px] mb-5 text-card-foreground [&_h2]:text-[16px] [&_h2]:font-semibold [&_h2]:mb-[15px] [&_>_p]:text-[12px] [&_>_p]:leading-[1.8] [&_>_p]:text-muted-foreground [&_>_p]:m-[0_0_20px] [&_.locale-switch]:inline-flex [&_.locale-switch]:[border:1px_solid_var(--border)] [&_.locale-switch]:rounded-[8px] [&_.locale-switch]:p-[5px] [&_.locale-switch_button]:p-[9px_14px] [&_.locale-switch_button]:text-[12px]">
      <h2>{p("studyProfile")}</h2>
      {[
        { label: "interests", value: profile.interests },
        { label: "goal", value: profile.goal },
        { label: "schedule", value: profile.availability },
      ]
        .filter((item) => item.value)
        .map((item) => (
          <div
            className="profile-detail p-[12px_0] [border-top:1px_solid_var(--border)] [&_strong]:text-[11px] [&_strong]:text-muted-foreground [&_strong]:font-medium [&_p]:text-[13px] [&_p]:leading-[1.8] [&_p]:mt-[5px] [&_p]:whitespace-pre-wrap [&_p]:[overflow-wrap:anywhere]"
            key={item.label}
          >
            <strong>{p(item.label)}</strong>
            <p>{item.value}</p>
          </div>
        ))}
    </Card>
  );
}
