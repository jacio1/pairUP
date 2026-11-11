"use client";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useFormatter, useTranslations } from "next-intl";
import {
  ArrowRight,
  Bell,
  BookOpen,
  CheckCheck,
  Clock3,
  FileText,
  Heart,
  MessageCircle,
  PlusCircle,
  Settings,
  Sparkles,
} from "lucide-react";
import { useAppSelector } from "./providers";
import { useBrowserStorage } from "@/lib/browser-storage";
import { emptyListing, type ListingDraft } from "@/lib/local-data";
import { Button } from "./ui/button";
import { JoinButton } from "./discover";
import { LanguageSwitcher } from "./shell";
import { ThemeToggle } from "./theme-toggle";

export function CreateListing() {
  const t = useTranslations("Product");
  const [draft, setDraft] = useState<ListingDraft>(emptyListing);
  function field(key: keyof ListingDraft, value: string) {
    setDraft((current) => ({ ...current, [key]: value }));
  }
  function submit(e: FormEvent) {
    e.preventDefault();
    window.alert(t("publishUnavailable"));
  }
  return (
    <main className="page form-page">
      <div className="page-heading">
        <div>
          <div className="eyebrow">
            <PlusCircle size={16} />
            {t("yourLearning")}
          </div>
          <h1>{t("create")}</h1>
          <p>{t("createText")}</p>
        </div>
      </div>
      <form className="product-form" onSubmit={submit}>
        <div className="form-section">
          <h2>{t("aboutListing")}</h2>
          <label htmlFor="listing-title">{t("title")}</label>
          <input
            id="listing-title"
            value={draft.title}
            maxLength={150}
            placeholder={t("titlePlaceholder")}
            onChange={(e) => field("title", e.target.value)}
          />
          <div className="form-grid">
            <div>
              <label htmlFor="subject">{t("subject")}</label>
              <select
                id="subject"
                value={draft.subject}
                onChange={(e) => field("subject", e.target.value)}
              >
                <option value="">{t("selectSubject")}</option>
                {[
                  "math",
                  "physics",
                  "chemistry",
                  "biology",
                  "computerScience",
                  "english",
                  "russian",
                  "history",
                  "socialStudies",
                  "other",
                ].map((key) => (
                  <option key={key} value={key}>
                    {t(key)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="level">{t("level")}</label>
              <select
                id="level"
                value={draft.level}
                onChange={(e) => field("level", e.target.value)}
              >
                <option value="">{t("selectLevel")}</option>
                {[
                  "beginner",
                  "intermediate",
                  "advanced",
                  "olympiad",
                  "examPreparation",
                ].map((key) => (
                  <option key={key} value={key}>
                    {t(key)}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <label htmlFor="goal">{t("goal")}</label>
          <input
            id="goal"
            value={draft.goal}
            maxLength={300}
            placeholder={t("goalPlaceholder")}
            onChange={(e) => field("goal", e.target.value)}
          />
        </div>
        <div className="form-section">
          <h2>{t("sessionDetails")}</h2>
          <fieldset className="format-options">
            <legend>{t("format")}</legend>
            {["online", "offline", "hybrid"].map((key) => (
              <label key={key}>
                <input
                  type="radio"
                  name="format"
                  value={key}
                  checked={draft.format === key}
                  onChange={() => field("format", key)}
                />
                {t(key)}
              </label>
            ))}
          </fieldset>
          <div className="form-grid">
            <div>
              <label htmlFor="schedule">{t("schedule")}</label>
              <input
                id="schedule"
                value={draft.schedule}
                maxLength={200}
                placeholder={t("schedulePlaceholder")}
                onChange={(e) => field("schedule", e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="location">{t("location")}</label>
              <input
                id="location"
                value={draft.location}
                maxLength={150}
                placeholder={t("locationPlaceholder")}
                onChange={(e) => field("location", e.target.value)}
              />
            </div>
          </div>
          <label htmlFor="description">{t("aboutPartner")}</label>
          <textarea
            id="description"
            rows={5}
            maxLength={2000}
            value={draft.description}
            placeholder={t("descriptionPlaceholder")}
            onChange={(e) => field("description", e.target.value)}
          />
        </div>
        <div className="form-actions">
          <Button type="submit">{t("publish")}</Button>
        </div>
      </form>
    </main>
  );
}

export function Conversations() {
  const t = useTranslations("Product");
  const d = useTranslations("Demo");
  const format = useFormatter();
  const { messages } = useAppSelector((s) => s.chat);
  const last = messages.at(-1);
  return (
    <main className="page">
      <div className="page-heading">
        <div>
          <div className="eyebrow">
            <MessageCircle size={16} />
            {t("yourConversations")}
          </div>
          <h1>{d("messages")}</h1>
          <p>{t("messagesText")}</p>
        </div>
      </div>
      <section className="conversation-list">
        <Link href="/messages/study-group" className="conversation-card">
          <span className="room-icon">
            <BookOpen size={24} />
          </span>
          <div>
            <div className="conversation-title">
              <h2>{d("chatTitle")}</h2>
              {last && (
                <time>
                  {format.dateTime(new Date(last.createdAt), {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </time>
              )}
            </div>
            <p>
              {last ? `${last.author}: ${last.text}` : t("conversationPreview")}
            </p>
            <span className="subject-tag">{t("groupConversation")}</span>
          </div>
          <ArrowRight size={18} />
        </Link>
      </section>
    </main>
  );
}

export function Notifications() {
  const t = useTranslations("Product");
  const d = useTranslations("Demo");
  const format = useFormatter();
  const { session, messages } = useAppSelector((state) => state.chat);
  const [readThrough, setReadThrough] = useBrowserStorage<number>(
    `pairup.notifications.read.${session?.id || "guest"}`,
    0,
  );
  const incoming = session
    ? messages.filter((message) => message.sessionId !== session.id)
    : [];
  const latest = incoming.at(-1);
  const unread = incoming.filter((message) => message.seq > readThrough).length;
  function markRead() {
    if (latest) setReadThrough(latest.seq);
  }
  return (
    <main className="page">
      <div className="page-heading">
        <div>
          <div className="eyebrow">
            <Bell size={16} />
            {t("stayUpdated")}
          </div>
          <h1>{t("notifications")}</h1>
          <p>{t("notificationsText")}</p>
        </div>
        {unread > 0 && (
          <button className="secondary-button" onClick={markRead}>
            <CheckCheck size={16} />
            {t("markAllRead")}
          </button>
        )}
      </div>
      {latest ? (
        <section className="notification-list">
          <Link
            href="/messages/study-group"
            className={`notification-row ${unread > 0 ? "unread" : ""}`}
            onClick={markRead}
          >
            <span className="benefit-icon violet">
              <MessageCircle size={20} />
            </span>
            <div>
              <h2>
                {d("chatTitle")}
                <time>
                  {format.dateTime(new Date(latest.createdAt), {
                    dateStyle: "short",
                    timeStyle: "short",
                  })}
                </time>
              </h2>
              <p>
                {unread > 0
                  ? t("newMessages", { count: unread })
                  : t("allMessagesRead")}
              </p>
            </div>
            {unread > 0 && <span className="nav-dot" />}
          </Link>
        </section>
      ) : (
        <EmptyState
          icon={Bell}
          title={t("noNotifications")}
          text={t("noNotificationsText")}
        />
      )}
    </main>
  );
}

function EmptyState({
  icon: Icon,
  title,
  text,
  children,
}: {
  icon: typeof Bell;
  title: string;
  text: string;
  children?: React.ReactNode;
}) {
  return (
    <section className="empty-state">
      <span className="empty-icon">
        <Icon size={28} />
      </span>
      <h2>{title}</h2>
      <p>{text}</p>
      {children}
    </section>
  );
}

export function MyListings() {
  const t = useTranslations("Product");
  return (
    <main className="page">
      <div className="page-heading">
        <div>
          <h1>{t("myListings")}</h1>
          <p>{t("myListingsText")}</p>
        </div>
        <Link href="/create" className="primary-button">
          <PlusCircle size={16} />
          {t("create")}
        </Link>
      </div>
      <EmptyState
        icon={FileText}
        title={t("noListings")}
        text={t("noListingsText")}
      >
        <Link href="/create" className="secondary-button">
          {t("create")}
        </Link>
      </EmptyState>
    </main>
  );
}
export function Favorites() {
  const t = useTranslations("Product");
  const d = useTranslations("Demo");
  const [favorite] = useBrowserStorage("pairup.favorite.demo-listing", false);
  return (
    <main className="page">
      <div className="page-heading">
        <div>
          <h1>{t("favorites")}</h1>
          <p>{t("favoritesText")}</p>
        </div>
      </div>
      {favorite ? (
        <article className="listing-card favorite-card">
          <span className="subject-tag">{d("technology")}</span>
          <h3>{d("listingTitle")}</h3>
          <p>{d("listingDescription")}</p>
          <div className="roadmap-cta">
            <JoinButton />
          </div>
        </article>
      ) : (
        <EmptyState
          icon={Heart}
          title={t("noFavorites")}
          text={t("noFavoritesText")}
        >
          <Link href="/" className="secondary-button">
            {d("discover")}
          </Link>
        </EmptyState>
      )}
    </main>
  );
}
export function SettingsPage() {
  const t = useTranslations("Product");
  return (
    <main className="page form-page">
      <div className="page-heading">
        <div>
          <div className="eyebrow">
            <Settings size={16} />
            PairUp
          </div>
          <h1>{t("settings")}</h1>
          <p>{t("settingsText")}</p>
        </div>
      </div>
      <section className="settings-card">
        <h2>{t("appearance")}</h2>
        <p>{t("appearanceText")}</p>
        <ThemeToggle expanded />
      </section>
      <section className="settings-card">
        <h2>{t("interfaceLanguage")}</h2>
        <p>{t("languageText")}</p>
        <LanguageSwitcher />
      </section>
    </main>
  );
}
export function Sessions() {
  const t = useTranslations("Product");
  return (
    <main className="page">
      <div className="page-heading">
        <div>
          <div className="eyebrow">
            <Clock3 size={16} />
            {t("yourLearning")}
          </div>
          <h1>{t("sessions")}</h1>
          <p>{t("sessionsText")}</p>
        </div>
      </div>
      <EmptyState
        icon={BookOpen}
        title={t("noSessions")}
        text={t("noSessionsText")}
      />
      <div className="coming-grid session-tools">
        {["notes", "tasks", "pomodoro"].map((key) => (
          <section className="coming-card" key={key}>
            <Sparkles size={21} />
            <span className="coming-badge">{t("inDevelopment")}</span>
            <h3>{t(key)}</h3>
            <p>{t(`${key}Text`)}</p>
          </section>
        ))}
      </div>
    </main>
  );
}
