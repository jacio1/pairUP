"use client";
import { JoinButton } from "@/components/auth/join-button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useTranslations } from "next-intl";
import type { ProfileForm } from "./use-profile-form";
export function ProfileOverview({
  form,
}: {
  form: Pick<ProfileForm, "profile" | "session" | "editing" | "setEditing">;
}) {
  const t = useTranslations("Demo");
  const p = useTranslations("Product");
  const { profile, session, editing, setEditing } = form;
  return (
    <Card className="block gap-0 ring-0 shadow-none profile-card p-[30px] [border:1px_solid_var(--border)] bg-card rounded-[18px] mb-6 [&_h2]:text-[22px] [&_h2]:m-[12px_0] [&_>_p]:text-[13px] [&_>_p]:leading-[1.8] [&_>_p]:text-muted-foreground [&_>_p]:mb-5 max-[760px]:p-[23px]">
      <Avatar
        className={`avatar inline-flex items-center justify-center bg-muted text-sidebar-primary rounded-full font-semibold shrink-0 [&.tiny]:h-8 [&.tiny]:w-8 [&.tiny]:text-[12px] [&.avatar-teal]:[background:color-mix(in_oklab,_var(--primary)_9%,_var(--card))] [&.avatar-teal]:text-muted-foreground [&.avatar-peach]:[background:color-mix(in_oklab,_var(--primary)_7%,_var(--card))] [&.avatar-peach]:text-primary [&.avatar-violet]:[background:color-mix(in_oklab,_var(--primary)_6%,_var(--card))] [&.avatar-violet]:text-primary profile-avatar h-15 w-15 text-[22px] avatar-${profile.avatar}`}
      >
        <AvatarFallback className="bg-transparent text-inherit [font-size:inherit]">
          {profile.name
            ? profile.name.slice(0, 1).toUpperCase()
            : session?.role === "presenter"
              ? "P"
              : "T"}
        </AvatarFallback>
      </Avatar>
      <h2>{profile.name || session?.name || t("guest")}</h2>
      {profile.bio && <p>{profile.bio}</p>}
      <div className="profile-buttons flex gap-[10px] flex-wrap items-center max-[760px]:gap-2">
        <Button
          variant="secondary"
          className="secondary-button min-h-10"
          onClick={() => setEditing(!editing)}
        >
          {p("editProfile")}
        </Button>
        <JoinButton />
      </div>
    </Card>
  );
}
