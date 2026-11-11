"use client";
import { useState, type FormEvent } from "react";
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
import { actions, api, useLoginMutation } from "@/lib/store";
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
  const dispatch = useAppDispatch();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [login, { isLoading }] = useLoginMutation();
  async function submit(e: FormEvent) {
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
    <main className="page profile-page">
      <div className="page-heading">
        <div>
          <div className="eyebrow">
            <ShieldCheck size={16} />
            {t("demoWorkspace")}
          </div>
          <h1>{t("profile")}</h1>
          <p>{t("profileText")}</p>
        </div>
      </div>
      <section className="profile-card">
        <span className={`avatar profile-avatar avatar-${profile.avatar}`}>
          {profile.name
            ? profile.name.slice(0, 1).toUpperCase()
            : session?.role === "presenter"
              ? "P"
              : "T"}
        </span>
        <h2>{profile.name || session?.name || t("guest")}</h2>
        {profile.bio && <p>{profile.bio}</p>}
        <div className="profile-buttons">
          <button
            className="secondary-button"
            onClick={() => setEditing(!editing)}
          >
            {p("editProfile")}
          </button>
          <JoinButton />
        </div>
      </section>
      <div className="profile-stats">
        <Link href="/my-listings">
          <strong>0</strong>
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
          className="product-form profile-editor"
          onSubmit={(e) => {
            e.preventDefault();
            setProfileStatus(
              saveProfile(profile) ? "profileSaved" : "storageError",
            );
          }}
        >
          <h2>{p("studyProfile")}</h2>
          <label htmlFor="display-name">{p("displayName")}</label>
          <input
            id="display-name"
            value={profile.name}
            maxLength={60}
            onChange={(e) => saveProfile({ ...profile, name: e.target.value })}
          />
          <fieldset className="avatar-colors">
            <legend>{p("avatarColor")}</legend>
            {["violet", "teal", "peach"].map((color) => (
              <label key={color} className={`avatar-color avatar-${color}`}>
                <input
                  aria-label={p(`color${color}`)}
                  type="radio"
                  name="avatar"
                  checked={profile.avatar === color}
                  onChange={() => saveProfile({ ...profile, avatar: color })}
                />
                <span aria-hidden="true" />
              </label>
            ))}
          </fieldset>
          {[
            { key: "bio", label: "bio" },
            { key: "interests", label: "interests" },
            { key: "goal", label: "goal" },
            { key: "availability", label: "schedule" },
          ].map(({ key, label }) => (
            <div key={key}>
              <label htmlFor={`profile-${key}`}>{p(label)}</label>
              <input
                id={`profile-${key}`}
                value={profile[key as keyof StudyProfile]}
                maxLength={500}
                onChange={(e) =>
                  saveProfile({ ...profile, [key]: e.target.value })
                }
              />
            </div>
          ))}
          <button className="secondary-button">
            <Save size={15} />
            {p("saveProfile")}
          </button>
          {profileStatus && (
            <p
              className={
                profileStatus === "storageError" ? "error-text" : "success-text"
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
          <section className="settings-card">
            <h2>{p("studyProfile")}</h2>
            {[
              { label: "interests", value: profile.interests },
              { label: "goal", value: profile.goal },
              { label: "schedule", value: profile.availability },
            ]
              .filter((item) => item.value)
              .map((item) => (
                <div className="profile-detail" key={item.label}>
                  <strong>{p(item.label)}</strong>
                  <p>{item.value}</p>
                </div>
              ))}
          </section>
        )}
      <nav className="profile-menu" aria-label={p("accountSections")}>
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
        <form className="presenter-form" onSubmit={submit}>
          <h2>
            <LockKeyhole size={20} />
            {t("presenterLogin")}
          </h2>
          <label htmlFor="password">{t("password")}</label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            maxLength={256}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button className="secondary-button" disabled={isLoading}>
            {t(isLoading ? "joining" : "signIn")}
          </button>
          {error && (
            <p className="error-text" role="alert">
              {errors(error)}
            </p>
          )}
        </form>
      )}
    </main>
  );
}
