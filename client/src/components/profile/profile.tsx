"use client";
import { ShieldCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import { PresenterAccess } from "./presenter-access";
import { ProfileEditor } from "./profile-editor";
import { ProfileMenu } from "./profile-menu";
import { ProfileOverview } from "./profile-overview";
import { ProfileStats } from "./profile-stats";
import { ProfileSummary } from "./profile-summary";
import { useProfileForm } from "./use-profile-form";
export function Profile() {
  const t = useTranslations("Demo");
  const form = useProfileForm();
  const { editing, profile, session } = form;
  return (
    <main className="page max-w-[1270px] w-full mx-auto p-[37px_48px_35px] flex-1 max-[1200px]:p-[30px] max-[1000px]:p-[26px] max-[760px]:p-[25px_20px] max-[480px]:p-[23px_17px] profile-page max-w-[850px]">
      <div className="page-heading flex justify-between items-center mb-[26px] gap-4 [&_h1]:text-[29px] [&_h1]:font-medium [&_h1]:tracking-[-1.2px] [&_h1]:leading-[1.4] [&_h1_>_span]:font-bold [&_p]:text-[12px] [&_p]:text-muted-foreground [&_p]:mt-[6px] [&_p]:leading-[1.7] max-[760px]:mb-[22px] max-[760px]:[&_h1]:text-[26px] max-[760px]:[&_p]:text-[11px] max-[480px]:[&_h1]:text-[23px] max-[480px]:[&_h1]:tracking-[-0.9px] max-[480px]:[&_h1]:leading-[1.4] max-[480px]:[&_p]:text-[10px] max-[760px]:[&_>_.primary-button]:text-[10px] max-[760px]:[&_>_.primary-button]:p-[9px] max-[760px]:[&_>_.primary-button]:gap-[5px]">
        <div>
          <div className="eyebrow flex gap-[7px] items-center tracking-[1.5px] text-[9px] font-semibold text-muted-foreground mb-[10px] [&_.online-dot]:w-[5px] [&_.online-dot]:h-[5px] max-[480px]:text-[8px]">
            <ShieldCheck size={16} />
            {t("demoWorkspace")}
          </div>
          <h1>{t("profile")}</h1>
          <p>{t("profileText")}</p>
        </div>
      </div>
      <ProfileOverview form={form} />
      <ProfileStats form={form} />
      {editing && <ProfileEditor form={form} />}
      {!editing &&
        (profile.interests || profile.goal || profile.availability) && (
          <ProfileSummary form={form} />
        )}
      <ProfileMenu />
      {session?.role !== "presenter" && <PresenterAccess />}
    </main>
  );
}
