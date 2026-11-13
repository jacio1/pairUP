"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { type StudyProfile } from "@/lib/local-data";
import { Save } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ProfileForm } from "./use-profile-form";
export function ProfileEditor({
  form,
}: {
  form: Pick<
    ProfileForm,
    "profile" | "saveProfile" | "profileStatus" | "setProfileStatus"
  >;
}) {
  const p = useTranslations("Product");
  const { profile, saveProfile, profileStatus, setProfileStatus } = form;
  return (
    <form
      className="product-form bg-card [border:1px_solid_var(--border)] rounded-[16px] p-7 text-card-foreground [&_h2]:text-[16px] [&_h2]:font-semibold [&_h2]:mb-[15px] max-[760px]:p-[21px] profile-editor mb-6 [&_button]:mt-5"
      onSubmit={(e) => {
        e.preventDefault();
        setProfileStatus(
          saveProfile(profile) ? "profileSaved" : "storageError",
        );
      }}
    >
      <h2>{p("studyProfile")}</h2>
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
        onChange={(e) => saveProfile({ ...profile, name: e.target.value })}
      />
      <fieldset className="avatar-colors border-0 p-0 m-[18px_0] flex flex-wrap gap-[9px] [&_legend]:text-[12px] [&_legend]:font-medium [&_legend]:mb-[10px] [&_.avatar-color]:m-0 [&_.avatar-color]:flex [&_.avatar-color]:items-center [&_.avatar-color]:justify-center [&_.avatar-color]:w-[38px] [&_.avatar-color]:h-[38px] [&_.avatar-color]:[border:2px_solid_transparent] [&_.avatar-color]:rounded-full [&_.avatar-color]:[cursor:pointer] max-[760px]:gap-3">
        <legend>{p("avatarColor")}</legend>
        <RadioGroup
          value={profile.avatar}
          onValueChange={(value) =>
            saveProfile({ ...profile, avatar: String(value) })
          }
          className="flex gap-3"
        >
          {["violet", "teal", "peach"].map((color) => (
            <Label
              key={color}
              className={`avatar-color [&:has([data-checked])]:border-primary avatar-${color}`}
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
            onChange={(e) => saveProfile({ ...profile, [key]: e.target.value })}
          />
        </div>
      ))}
      <Button
        type="submit"
        variant="secondary"
        className="secondary-button min-h-10"
      >
        <Save size={15} />
        {p("saveProfile")}
      </Button>
      {profileStatus && (
        <p
          className={
            profileStatus === "storageError"
              ? "error-text text-[11px] text-destructive! mt-[10px]! leading-[1.6]"
              : "success-text text-[12px] text-primary mt-[14px] leading-[1.8]"
          }
          role="status"
        >
          {p(profileStatus)}
        </p>
      )}
    </form>
  );
}
