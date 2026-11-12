"use client";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { useState, type SubmitEvent } from "react";
import { useTranslations } from "next-intl";
import {
  BookOpen,
  ChevronRight,
  FileText,
  Heart,
  LockKeyhole,
  Save,
  Settings,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { useBrowserStorage } from "@/lib/browser-storage";
import { emptyProfile, type StudyProfile } from "@/lib/local-data";
import { useAppDispatch, useAppSelector } from "./providers";
import { actions, api, useLoginMutation, useListingsQuery } from "@/lib/store";
import { JoinButton, errorCode } from "./discover";

export function Profile() {
  const t = useTranslations("Demo");
  const errors = useTranslations("Errors");
  const p = useTranslations("Product");
  const [profile, saveProfile] = useBrowserStorage<StudyProfile>(
    "pairup.study-profile",
    emptyProfile,
  );
  const [favorite] = useBrowserStorage("pairup.favorite.demo-listing", false);
  const [editing, setEditing] = useState(false);
  const [profileStatus, setProfileStatus] = useState("");
  const session = useAppSelector((s) => s.chat.session);
  const { data: myListings } = useListingsQuery(session?.id, {
    skip: !session,
  });
  const dispatch = useAppDispatch();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [login, { isLoading }] = useLoginMutation();
  async function submit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    try {
      const result = await login({ password }).unwrap();
      dispatch(api.util.upsertQueryData("me", undefined, result));
      dispatch(actions.session(result));
      setPassword("");
    } catch (e) {
      setError(errorCode(e));
    }
  }
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
      <div className="profile-stats grid grid-cols-[repeat(3,_1fr)] gap-3 mb-6 [&_a]:p-[20px_10px] [&_a]:flex [&_a]:flex-col [&_a]:gap-2 [&_a]:items-center [&_a]:[border:1px_solid_var(--border)] [&_a]:rounded-[12px] [&_a]:bg-card [&_strong]:text-[23px] [&_strong]:text-foreground [&_span]:text-[11px] [&_span]:text-muted-foreground [&_span]:text-center max-[760px]:[&_a]:p-[17px_7px] max-[760px]:[&_span]:text-[10px]">
        <Link href="/my-listings">
          <strong>{myListings?.length ?? 0}</strong>
          <span>{p("myListings")}</span>
        </Link>
        <Link href="/sessions">
          <strong>0</strong>
          <span>{p("sessions")}</span>
        </Link>
        <Link href="/favorites">
          <strong>{favorite ? 1 : 0}</strong>
          <span>{p("favorites")}</span>
        </Link>
      </div>
      {editing && (
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
                  <RadioGroupItem
                    aria-label={p(`color${color}`)}
                    value={color}
                  />
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
                  saveProfile({ ...profile, [key]: e.target.value })
                }
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
      )}
      {!editing &&
        (profile.interests || profile.goal || profile.availability) && (
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
        )}
      <nav
        className="profile-menu bg-card [border:1px_solid_var(--border)] rounded-[16px] overflow-hidden mb-6 [&_a]:p-[18px_22px] [&_a]:flex [&_a]:items-center [&_a]:gap-3 [&_a]:text-[13px] [&_a]:[border-bottom:1px_solid_var(--border)] [&_a:last-child]:[border-bottom:0] [&_a:hover]:bg-muted [&_svg]:text-muted-foreground [&_a_>_span]:flex-1"
        aria-label={p("accountSections")}
      >
        {[
          { href: "/my-listings", label: "myListings", icon: FileText },
          { href: "/favorites", label: "favorites", icon: Heart },
          { href: "/sessions", label: "sessions", icon: BookOpen },
          { href: "/settings", label: "settings", icon: Settings },
        ].map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href}>
            <Icon size={19} />
            <span>{p(label)}</span>
            <ChevronRight size={17} />
          </Link>
        ))}
      </nav>
      {session?.role !== "presenter" && (
        <form
          className="presenter-form p-[30px] [border:1px_solid_var(--border)] bg-card rounded-[18px] mb-6 [&_>_p]:text-[13px] [&_>_p]:leading-[1.8] [&_>_p]:text-muted-foreground [&_>_p]:mb-5 [&_h2]:flex [&_h2]:gap-[10px] [&_h2]:items-center [&_h2]:text-[16px] [&_h2]:mb-[10px] max-[760px]:p-[23px]"
          onSubmit={submit}
        >
          <h2>
            <LockKeyhole size={20} />
            {t("presenterLogin")}
          </h2>
          <Label
            className="mb-2 mt-4 block text-xs font-medium"
            htmlFor="password"
          >
            {t("password")}
          </Label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            maxLength={256}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button
            type="submit"
            variant="secondary"
            className="secondary-button min-h-10"
            disabled={isLoading}
          >
            {t(isLoading ? "joining" : "signIn")}
          </Button>
          {error && (
            <p
              className="error-text text-[11px] text-destructive! mt-[10px]! leading-[1.6]"
              role="alert"
            >
              {errors(error)}
            </p>
          )}
        </form>
      )}
    </main>
  );
}
