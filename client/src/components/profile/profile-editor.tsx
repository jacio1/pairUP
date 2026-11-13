"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { type StudyProfile } from "@/lib/local-data";
import { Save } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import type { ProfileForm } from "./use-profile-form";
export function ProfileEditor({
  form,
  onSaved,
  onCancel,
}: {
  form: Pick<
    ProfileForm,
    | "editorProfile"
    | "publicProfile"
    | "saveProfile"
    | "profileStatus"
    | "saving"
  >;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const p = useTranslations("Product");
  const t = useTranslations("Demo");
  const social = useTranslations("SocialProfile");
  const { saveProfile, profileStatus, saving } = form;
  const [profile, setProfile] = useState(form.editorProfile);
  const [version] = useState(form.publicProfile!.version);
  return (
    <form
      className="profile-editor min-w-0"
      onSubmit={async (e) => {
        e.preventDefault();
        const saved = await saveProfile(profile, version);
        if (saved) onSaved();
      }}
    >
      <fieldset disabled={saving} className="min-w-0">
        <Label
          className="mb-2 mt-4 block text-xs font-medium"
          htmlFor="display-name"
        >
          {p("displayName")}
        </Label>
        <Input
          id="display-name"
          value={profile.name}
          maxLength={60}
          required
          onChange={(e) => setProfile({ ...profile, name: e.target.value })}
        />
        <fieldset className="avatar-colors border-0 p-0 m-[18px_0] flex flex-wrap gap-[9px] [&_legend]:text-[12px] [&_legend]:font-medium [&_legend]:mb-[10px] [&_.avatar-color]:m-0 [&_.avatar-color]:flex [&_.avatar-color]:items-center [&_.avatar-color]:justify-center [&_.avatar-color]:w-[38px] [&_.avatar-color]:h-[38px] [&_.avatar-color]:[border:2px_solid_transparent] [&_.avatar-color]:rounded-full [&_.avatar-color]:[cursor:pointer] max-[760px]:gap-3">
          <legend>{p("avatarColor")}</legend>
          <RadioGroup
            value={profile.avatar}
            onValueChange={(value) =>
              setProfile({ ...profile, avatar: String(value) })
            }
            className="flex gap-3"
          >
            {["violet", "teal", "peach"].map((color) => (
              <Label
                key={color}
                className={`avatar-color [&:has([data-checked])]:border-primary ${color === "violet" ? "bg-violet-100 text-violet-700 dark:bg-violet-500/20" : color === "teal" ? "bg-teal-100 text-teal-700 dark:bg-teal-500/20" : "bg-orange-100 text-orange-700 dark:bg-orange-500/20"}`}
              >
                <RadioGroupItem aria-label={p(`color${color}`)} value={color} />
                <span aria-hidden="true" />
              </Label>
            ))}
          </RadioGroup>
        </fieldset>
        {[
          { key: "bio", label: "bio" },
          { key: "interests", label: "interests" },
          { key: "goal", label: "goal" },
          { key: "availability", label: "schedule" },
        ].map(({ key, label }) => (
          <div key={key}>
            <Label
              className="mb-2 mt-4 block text-xs font-medium"
              htmlFor={`profile-${key}`}
            >
              {p(label)}
            </Label>
            <Input
              id={`profile-${key}`}
              value={profile[key as keyof StudyProfile]}
              maxLength={500}
              onChange={(e) =>
                setProfile({ ...profile, [key]: e.target.value })
              }
            />
          </div>
        ))}
        <div className="sticky -bottom-6 mt-6 flex flex-wrap justify-end gap-2 border-t bg-popover py-4">
          <Button
            type="button"
            variant="outline"
            disabled={saving}
            onClick={onCancel}
          >
            {t("cancel")}
          </Button>
          <Button
            type="submit"
            disabled={saving}
            variant="default"
            className="secondary-button min-h-10"
          >
            <Save size={15} />
            {saving ? social("saving") : p("saveProfile")}
          </Button>
        </div>
        {profileStatus && profileStatus !== "profileSaved" && (
          <p className="mt-3 text-xs leading-6 text-destructive" role="alert">
            {social(social.has(profileStatus) ? profileStatus : "SERVER_ERROR")}
          </p>
        )}
      </fieldset>
    </form>
  );
}
