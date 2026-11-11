"use client";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Check,
  Clock3,
  FileText,
  GraduationCap,
  MessageCircle,
  Search,
  SlidersHorizontal,
  Sparkles,
  Timer,
  Users,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { actions, api, useLoginMutation } from "@/lib/store";
import { useAppDispatch, useAppSelector } from "./providers";
import { useBrowserStorage } from "@/lib/browser-storage";
import { Heart, PlusCircle } from "lucide-react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";

export function errorCode(error: unknown) {
  const code = (error as { data?: { code?: string } })?.data?.code;
  const supported = [
    "RATE_LIMIT",
    "INVALID_PASSWORD",
    "UNAUTHORIZED",
    "FORBIDDEN",
    "AI_BUSY",
    "AI_UNAVAILABLE",
    "AI_INTERRUPTED",
    "INVALID_INPUT",
    "MESSAGE_NOT_FOUND",
  ];
  return supported.includes(code || "") ? code! : "SERVER_ERROR";
}
export function JoinButton({
  className = "primary-button",
  label,
}: {
  className?: string;
  label?: string;
}) {
  const t = useTranslations("Demo");
  const errors = useTranslations("Errors");
  const router = useRouter();
  const [login, { isLoading }] = useLoginMutation();
  const dispatch = useAppDispatch();
  const session = useAppSelector((s) => s.chat.session);
  const [error, setError] = useState("");
  async function join() {
    if (session) {
      router.push("/messages/study-group");
      return;
    }
    try {
      setError("");
      const result = await login({}).unwrap();
      dispatch(api.util.upsertQueryData("me", undefined, result));
      dispatch(actions.session(result));
      router.push("/messages/study-group");
    } catch (e) {
      setError(errorCode(e));
    }
  }
  return (
    <div className="join-action">
      <button className={className} onClick={join} disabled={isLoading}>
        {isLoading
          ? t("joining")
          : label || t(session ? "openChat" : "tryTest")}
        <ArrowRight size={18} />
      </button>
      {error && (
        <p className="error-text" role="alert">
          {errors(error)}
        </p>
      )}
    </div>
  );
}
export function NeuronArt({ small = false }: { small?: boolean }) {
  const t = useTranslations("Demo");
  return (
    <div className={small ? "neuron-art small" : "neuron-art"}>
      <Image
        src="/pairup-reference.png"
        alt={t("mascotAlt")}
        width={1254}
        height={1254}
        priority={!small}
      />
    </div>
  );
}
export function Discover() {
  const t = useTranslations("Demo");
  const p = useTranslations("Product");
  const [favorite, setFavorite] = useBrowserStorage(
    "pairup.favorite.demo-listing",
    false,
  );
  return (
    <main className="page discover-page">
      <section className="page-heading">
        <div>
          <div className="eyebrow">
            <span className="online-dot" />
            {t("newWay")}
          </div>
          <h1>{p("discoverTitle")}</h1>
          <p>{t("welcomeText")}</p>
        </div>
        <span className="heading-note">
          <Link className="secondary-button" href="/create">
            <PlusCircle size={16} />
            {p("create")}
          </Link>
        </span>
      </section>
      <section className="listing-search" aria-label={p("searchListings")}>
        <form onSubmit={(event) => event.preventDefault()}>
          <div className="search-main">
            <div className="search-input-wrap">
              <Search size={19} />
              <Input
                aria-label={p("searchListings")}
                placeholder={p("searchPlaceholder")}
              />
            </div>
            <Button type="submit">
              <Search size={16} />
              {p("searchButton")}
            </Button>
          </div>
          <div className="search-filters">
            <span className="filter-label">
              <SlidersHorizontal size={16} />
              {p("filters")}
            </span>
            <select aria-label={p("subject")} defaultValue="all">
              <option value="all">{t("allSubjects")}</option>
              <option value="technology">{t("technology")}</option>
              <option value="math">{p("math")}</option>
              <option value="languages">{t("languages")}</option>
            </select>
            <select aria-label={p("level")} defaultValue="all">
              <option value="all">{p("anyLevel")}</option>
              <option value="beginner">{p("beginner")}</option>
              <option value="intermediate">{p("intermediate")}</option>
              <option value="advanced">{p("advanced")}</option>
            </select>
            <select aria-label={p("format")} defaultValue="all">
              <option value="all">{p("anyFormat")}</option>
              <option value="online">{p("online")}</option>
              <option value="offline">{p("offline")}</option>
              <option value="hybrid">{p("hybrid")}</option>
            </select>
            <select aria-label={p("schedule")} defaultValue="any">
              <option value="any">{p("anyTime")}</option>
              <option value="today">{p("today")}</option>
              <option value="evening">{p("evenings")}</option>
              <option value="weekend">{p("weekends")}</option>
            </select>
            <Button type="reset" variant="ghost">
              {p("resetFilters")}
            </Button>
          </div>
        </form>
      </section>
      <section className="hero">
        <div className="hero-copy">
          <div className="hero-badge">
            <Sparkles size={14} />
            {t("aiLearning")}
          </div>
          <h2>
            {t("heroLine1")}
            <br />
            <span>{t("heroLine2")}</span>
          </h2>
          <p>{t("heroText")}</p>
          <JoinButton />
        </div>
        <div className="hero-visual">
          <div className="hero-orbit" />
          <NeuronArt />
          <div className="floating-label label-focus">
            <Zap size={17} />
            {t("focusTogether")}
          </div>
          <div className="floating-label label-neuron">
            <span className="online-dot" />
            {t("neuronReady")}
          </div>
          <span className="hero-spark spark-one">✦</span>
          <span className="hero-spark spark-two">✧</span>
        </div>
      </section>
      <div className="discovery-grid">
        <section>
          <div className="section-heading">
            <h2>
              {t("findSession")} <span className="section-count">1</span>
            </h2>
            <span>{t("handpicked")}</span>
          </div>
          <article className="listing-card">
            <div className="listing-top">
              <span className="subject-tag">
                <GraduationCap size={14} />
                {t("technology")}
              </span>
              <span className="live-tag">
                <span className="online-dot" />
                {t("joinNow")}
              </span>
              <button
                className={`favorite-toggle ${favorite ? "saved" : ""}`}
                aria-label={p(favorite ? "removeFavorite" : "addFavorite")}
                aria-pressed={favorite}
                onClick={() => setFavorite(!favorite)}
              >
                <Heart size={17} fill={favorite ? "currentColor" : "none"} />
              </button>
            </div>
            <h3>{t("listingTitle")}</h3>
            <p>{t("listingDescription")}</p>
            <div className="listing-tags">
              <span>{t("aiEducation")}</span>
              <span>{t("englishRussian")}</span>
              <span>{t("allLevels")}</span>
            </div>
            <div className="listing-meta">
              <span>
                <Users size={15} />
                {t("openGroup")}
              </span>
              <span>
                <Clock3 size={15} />
                {t("liveSession")}
              </span>
            </div>
            <div className="listing-bottom">
              <div className="host">
                <span className="avatar host-avatar">P</span>
                <span>
                  <strong>{t("presenter")}</strong>
                  <small>{t("sessionHost")}</small>
                </span>
              </div>
              <JoinButton
                className="secondary-button"
                label={t("joinConversation")}
              />
            </div>
          </article>
        </section>
        <aside className="neuron-card">
          <div className="neuron-card-top">
            <span className="benefit-icon violet">
              <Sparkles size={20} />
            </span>
            <span className="ai-pill">AI</span>
          </div>
          <h3>{t("meetNeuronTitle")}</h3>
          <p>{t("meetNeuronText")}</p>
          <ul>
            <li>
              <Check size={15} />
              {t("translate")}
            </li>
            <li>
              <Check size={15} />
              {t("summarize")}
            </li>
            <li>
              <Check size={15} />
              {t("explain")}
            </li>
          </ul>
          <div className="neuron-example">
            <MessageCircle size={15} />
            <span>{t("neuronExample")}</span>
          </div>
          <Link href="/messages/study-group">
            {t("seeInAction")}
            <ArrowUpRight size={16} />
          </Link>
        </aside>
      </div>
      <section className="coming-section product-tool-links">
        <div className="section-heading">
          <h2>{p("learningTools")}</h2>
          <Link href="/sessions">
            {p("sessions")}
            <ArrowRight size={14} />
          </Link>
        </div>
        <div className="coming-grid">
          {[
            { icon: Users, title: "matching", text: "matchingText" },
            { icon: Timer, title: "studyRooms", text: "studyRoomsText" },
            { icon: FileText, title: "materials", text: "materialsText" },
          ].map(({ icon: Icon, title, text }) => (
            <Link
              href={title === "matching" ? "/profile" : "/sessions"}
              className="coming-card"
              key={title}
            >
              <Icon size={21} />
              <span className="coming-badge">
                {p(title === "matching" ? "yourInterests" : "inDevelopment")}
              </span>
              <h3>{t(title)}</h3>
              <p>{t(text)}</p>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
export function Roadmap() {
  const t = useTranslations("Demo");
  return (
    <main className="page">
      <div className="page-heading">
        <div>
          <div className="eyebrow">
            <BookOpen size={16} />
            PairUp
          </div>
          <h1>{t("nextChapter")}</h1>
          <p>{t("roadmapText")}</p>
        </div>
      </div>
      <div className="coming-grid">
        {["matching", "studyRooms", "materials"].map((key) => (
          <article className="coming-card" key={key}>
            <Sparkles />
            <span className="coming-badge">{t("comingSoon")}</span>
            <h3>{t(key)}</h3>
            <p>{t(`${key}Text`)}</p>
          </article>
        ))}
      </div>
      <div className="roadmap-cta">
        <JoinButton />
      </div>
    </main>
  );
}
