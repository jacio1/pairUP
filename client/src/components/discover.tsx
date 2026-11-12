"use client";
import { Badge } from "./ui/badge";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Card } from "./ui/card";
import { ListingList } from "./listing-list";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "./ui/select";
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
  className = "primary-button min-h-10",
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
      <Button
        variant={
          className.includes("secondary-button") ? "secondary" : "default"
        }
        className={className}
        onClick={join}
        disabled={isLoading}
      >
        {isLoading
          ? t("joining")
          : label || t(session ? "openChat" : "tryTest")}
        <ArrowRight size={18} />
      </Button>
      {error && (
        <p
          className="error-text text-[11px] text-destructive! mt-[10px]! leading-[1.6]"
          role="alert"
        >
          {errors(error)}
        </p>
      )}
    </div>
  );
}
export function NeuronArt({ small = false }: { small?: boolean }) {
  const t = useTranslations("Demo");
  return (
    <div
      className={
        small
          ? "neuron-art w-85 h-75 relative overflow-hidden [isolation:isolate] [mix-blend-mode:multiply] shrink-0 [&_img]:absolute [&_img]:w-145! [&_img]:h-145! [&_img]:max-w-[none]! [&_img]:left-[-6px] [&_img]:top-[-13px] [&_img]:object-contain [&.small]:w-[198px] [&.small]:h-[185px] [&.small]:m-[0_auto_15px] [&.small_img]:w-90! [&.small_img]:h-90! [&.small_img]:left-[-4px] [&.small_img]:top-[-8px] [&:not(.small)]:w-80 small"
          : "neuron-art w-85 h-75 relative overflow-hidden [isolation:isolate] [mix-blend-mode:multiply] shrink-0 [&_img]:absolute [&_img]:w-145! [&_img]:h-145! [&_img]:max-w-[none]! [&_img]:left-[-6px] [&_img]:top-[-13px] [&_img]:object-contain [&.small]:w-[198px] [&.small]:h-[185px] [&.small]:m-[0_auto_15px] [&.small_img]:w-90! [&.small_img]:h-90! [&.small_img]:left-[-4px] [&.small_img]:top-[-8px] [&:not(.small)]:w-80"
      }
    >
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
const defaultFilters = {
  subject: "all",
  level: "all",
  format: "all",
  schedule: "any",
};

export function Discover() {
  const [filters, setFilters] = useState(defaultFilters);
  const t = useTranslations("Demo");
  const p = useTranslations("Product");
  const [favorite, setFavorite] = useBrowserStorage(
    "pairup.favorite.demo-listing",
    false,
  );
  return (
    <main className="page max-w-[1270px] w-full mx-auto p-[37px_48px_35px] flex-1 max-[1200px]:p-[30px] max-[1000px]:p-[26px] max-[760px]:p-[25px_20px] max-[480px]:p-[23px_17px] discover-page [&_.hero]:min-h-[250px] [&_.hero-copy]:pt-[25px] [&_.hero-copy]:pb-[25px] [&_.hero_h2]:text-[30px] [&_.hero-visual_.neuron-art]:[transform:scale(0.82)] [&_.hero-copy_>_p]:max-w-[350px] [&_.hero-badge]:mb-3 max-[480px]:[&_.hero]:min-h-0 max-[480px]:[&_.hero_h2]:text-[26px] max-[480px]:[&_.hero-copy]:pt-5 max-[480px]:[&_.hero-copy]:pb-0 max-[480px]:[&_.hero-copy_>_p]:max-w-[270px] max-[480px]:[&_.hero-visual]:h-40 max-[480px]:[&_.hero-visual]:mt-0 max-[480px]:[&_.hero-visual_.neuron-art]:[transform:scale(0.62)] max-[480px]:[&_.label-neuron]:bottom-[15px]">
      <section className="page-heading flex justify-between items-center mb-[26px] gap-4 [&_h1]:text-[29px] [&_h1]:font-medium [&_h1]:tracking-[-1.2px] [&_h1]:leading-[1.4] [&_h1_>_span]:font-bold [&_p]:text-[12px] [&_p]:text-muted-foreground [&_p]:mt-[6px] [&_p]:leading-[1.7] max-[760px]:mb-[22px] max-[760px]:[&_h1]:text-[26px] max-[760px]:[&_p]:text-[11px] max-[480px]:[&_h1]:text-[23px] max-[480px]:[&_h1]:tracking-[-0.9px] max-[480px]:[&_h1]:leading-[1.4] max-[480px]:[&_p]:text-[10px] max-[760px]:[&_>_.primary-button]:text-[10px] max-[760px]:[&_>_.primary-button]:p-[9px] max-[760px]:[&_>_.primary-button]:gap-[5px]">
        <div>
          <div className="eyebrow flex gap-[7px] items-center tracking-[1.5px] text-[9px] font-semibold text-muted-foreground mb-[10px] [&_.online-dot]:w-[5px] [&_.online-dot]:h-[5px] max-[480px]:text-[8px]">
            <span className="online-dot w-[6px] h-[6px] bg-sidebar-primary rounded-full inline-block shrink-0" />
            {t("newWay")}
          </div>
          <h1>{p("discoverTitle")}</h1>
          <p>{t("welcomeText")}</p>
        </div>
        <span className="heading-note flex items-center gap-[6px] text-muted-foreground text-[10px] whitespace-nowrap [&_svg]:text-primary max-[1200px]:hidden">
          <Button
            className="secondary-button min-h-10"
            nativeButton={false}
            render={<Link href="/create" />}
            variant="secondary"
          >
            <PlusCircle size={16} />
            {p("create")}
          </Button>
        </span>
      </section>
      <section
        className="listing-search bg-card [border:1px_solid_var(--border)] rounded-lg p-5 mb-[22px] max-[760px]:p-[15px]"
        aria-label={p("searchListings")}
      >
        <form
          onSubmit={(event) => event.preventDefault()}
          onReset={() => setFilters(defaultFilters)}
        >
          <div className="search-main flex gap-[10px] items-center [&_>_button]:h-[42px] [&_>_button]:pl-[22px] [&_>_button]:pr-[22px] max-[760px]:[&_>_button]:pl-3 max-[760px]:[&_>_button]:pr-3 max-[760px]:[&_>_button_>_svg]:hidden">
            <div className="search-input-wrap relative flex-1 min-w-0 [&_>_svg]:absolute [&_>_svg]:left-3 [&_>_svg]:top-[50%] [&_>_svg]:[transform:translateY(-50%)] [&_>_svg]:text-muted-foreground [&_>_svg]:pointer-events-none [&_input]:pl-10 [&_input]:h-[42px] max-[760px]:[&_input]:text-[16px]">
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
          <div className="mt-4 flex flex-wrap items-center gap-2.5 max-[760px]:gap-2">
            <span className="filter-label flex items-center gap-[6px] text-[12px] text-muted-foreground mr-1 max-[760px]:w-full">
              <SlidersHorizontal size={16} />
              {p("filters")}
            </span>
            <Select
              value={filters.subject}
              onValueChange={(value) =>
                setFilters((current) => ({
                  ...current,
                  subject: value ?? defaultFilters.subject,
                }))
              }
              items={[
                { value: "all", label: t("allSubjects") },
                { value: "technology", label: t("technology") },
                { value: "math", label: p("math") },
                { value: "languages", label: t("languages") },
              ]}
            >
              <SelectTrigger
                className="min-w-0 flex-1 max-[760px]:basis-[calc(50%-8px)]"
                aria-label={p("subject")}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("allSubjects")}</SelectItem>
                <SelectItem value="technology">{t("technology")}</SelectItem>
                <SelectItem value="math">{p("math")}</SelectItem>
                <SelectItem value="languages">{t("languages")}</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={filters.level}
              onValueChange={(value) =>
                setFilters((current) => ({
                  ...current,
                  level: value ?? defaultFilters.level,
                }))
              }
              items={[
                { value: "all", label: p("anyLevel") },
                { value: "beginner", label: p("beginner") },
                { value: "intermediate", label: p("intermediate") },
                { value: "advanced", label: p("advanced") },
              ]}
            >
              <SelectTrigger
                className="min-w-0 flex-1 max-[760px]:basis-[calc(50%-8px)]"
                aria-label={p("level")}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{p("anyLevel")}</SelectItem>
                <SelectItem value="beginner">{p("beginner")}</SelectItem>
                <SelectItem value="intermediate">
                  {p("intermediate")}
                </SelectItem>
                <SelectItem value="advanced">{p("advanced")}</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={filters.format}
              onValueChange={(value) =>
                setFilters((current) => ({
                  ...current,
                  format: value ?? defaultFilters.format,
                }))
              }
              items={[
                { value: "all", label: p("anyFormat") },
                { value: "online", label: p("online") },
                { value: "offline", label: p("offline") },
                { value: "hybrid", label: p("hybrid") },
              ]}
            >
              <SelectTrigger
                className="min-w-0 flex-1 max-[760px]:basis-[calc(50%-8px)]"
                aria-label={p("format")}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{p("anyFormat")}</SelectItem>
                <SelectItem value="online">{p("online")}</SelectItem>
                <SelectItem value="offline">{p("offline")}</SelectItem>
                <SelectItem value="hybrid">{p("hybrid")}</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={filters.schedule}
              onValueChange={(value) =>
                setFilters((current) => ({
                  ...current,
                  schedule: value ?? defaultFilters.schedule,
                }))
              }
              items={[
                { value: "any", label: p("anyTime") },
                { value: "today", label: p("today") },
                { value: "evening", label: p("evenings") },
                { value: "weekend", label: p("weekends") },
              ]}
            >
              <SelectTrigger
                className="min-w-0 flex-1 max-[760px]:basis-[calc(50%-8px)]"
                aria-label={p("schedule")}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">{p("anyTime")}</SelectItem>
                <SelectItem value="today">{p("today")}</SelectItem>
                <SelectItem value="evening">{p("evenings")}</SelectItem>
                <SelectItem value="weekend">{p("weekends")}</SelectItem>
              </SelectContent>
            </Select>
            <Button type="reset" variant="ghost">
              {p("resetFilters")}
            </Button>
          </div>
        </form>
      </section>
      <section className="hero [border:1px_solid_var(--border)] [background:linear-gradient(_110deg,_color-mix(in_oklab,_var(--primary)_4%,_var(--card))_0%,_color-mix(in_oklab,_var(--primary)_4%,_var(--card))_45%,_color-mix(in_oklab,_var(--primary)_4%,_var(--card))_100%_)] rounded-[21px] flex min-h-[339px] relative overflow-hidden [&_h2]:text-[clamp(25px,_2.5vw,_37px)] [&_h2]:leading-[1.3] [&_h2]:tracking-[-1.5px] [&_h2]:font-bold [&_h2_>_span]:text-sidebar-primary min-[1550px]:min-h-[370px] max-[1200px]:[&_h2]:text-[30px] max-[1000px]:[&_h2]:text-[26px] max-[760px]:min-h-[325px] max-[760px]:[&_h2]:text-[27px] max-[480px]:min-h-0 max-[480px]:block max-[480px]:[&_h2]:text-[29px] max-[480px]:[&_h2]:tracking-[-1.2px] max-[480px]:[&_h2]:max-w-75">
        <div className="hero-copy w-[59%] p-[30px_0_29px_33px] z-[2] [&_>_p]:text-[12px] [&_>_p]:text-muted-foreground [&_>_p]:leading-[1.9] [&_>_p]:max-w-85 [&_>_p]:m-[13px_0_21px] min-[1550px]:pt-10 max-[1200px]:pl-[25px] max-[1200px]:[&_>_p]:max-w-[275px] max-[1000px]:[&_>_p]:text-[11px] max-[1000px]:[&_>_p]:max-w-60 max-[760px]:p-[25px_0_25px_24px] max-[760px]:w-[60%] max-[760px]:[&_>_p]:text-[11px] max-[760px]:[&_>_p]:max-w-65 max-[480px]:p-[23px_23px_0] max-[480px]:w-full max-[480px]:pb-0 max-[480px]:[&_>_p]:max-w-[255px] max-[480px]:[&_>_p]:text-[11px] max-[480px]:[&_>_p]:m-[11px_0_16px]">
          <div className="hero-badge inline-flex items-center gap-[6px] text-[8px] font-semibold tracking-[1px] text-sidebar-primary [background:color-mix(in_oklab,_var(--card)_71%,_transparent)] [border:1px_solid_var(--border)] rounded-[6px] p-[6px_8px] mb-4 max-[760px]:text-[7px] max-[480px]:mb-[14px]">
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
        <div className="hero-visual absolute [inset:0_0_0_55%] flex items-center justify-center min-[1550px]:[&_.neuron-art]:[transform:scale(1.12)] max-[1200px]:left-[53%] max-[1200px]:[&_.neuron-art]:[transform:scale(0.88)] max-[1000px]:[&_.neuron-art]:[transform:scale(0.8)] max-[760px]:left-[52%] max-[760px]:[&_.neuron-art]:[transform:scale(0.86)] max-[480px]:[inset:auto] max-[480px]:w-full max-[480px]:h-55 max-[480px]:pointer-events-none max-[480px]:relative max-[480px]:mt-[6px] max-[480px]:[&_.neuron-art]:[transform:scale(0.78)] dark:[&_.neuron-art]:[mix-blend-mode:normal] dark:[&_.neuron-art]:[mask-image:radial-gradient(_ellipse_56%_56%_at_50%_51%,_#000_35%,_transparent_83%_)]">
          <div className="hero-orbit absolute w-[285px] h-[285px] [border:1px_dashed_var(--border)] rounded-full [transform:rotate(-15deg)] [background:radial-gradient(_color-mix(_in_oklab,_color-mix(in_oklab,_var(--primary)_12%,_var(--card))_33%,_transparent_),_transparent_65%_)] max-[480px]:w-50 max-[480px]:h-50" />
          <NeuronArt />
          <div className="floating-label absolute flex items-center gap-[7px] text-[9px] font-medium p-[10px_12px] [background:color-mix(in_oklab,_var(--card)_92%,_transparent)] rounded-[9px] [box-shadow:0_5px_18px_color-mix(in_oklab,_var(--foreground)_8%,_transparent)] z-[3] whitespace-nowrap max-[760px]:[&.label-focus]:right-[10px] max-[760px]:[&.label-focus]:top-[35px] max-[760px]:[&.label-neuron]:left-0 max-[760px]:[&.label-neuron]:bottom-[30px] max-[480px]:[&.label-neuron]:text-[7px] max-[480px]:[&.label-neuron]:left-[10px] max-[480px]:[&.label-neuron]:bottom-[23px] max-[480px]:[&.label-neuron]:p-2 label-focus right-[17px] top-[46px] [transform:rotate(5deg)] text-muted-foreground [&_svg]:text-muted-foreground max-[1000px]:right-2 max-[1000px]:top-9 max-[1000px]:text-[8px] max-[1000px]:p-2 max-[480px]:hidden">
            <Zap size={17} />
            {t("focusTogether")}
          </div>
          <div className="floating-label absolute flex items-center gap-[7px] text-[9px] font-medium p-[10px_12px] [background:color-mix(in_oklab,_var(--card)_92%,_transparent)] rounded-[9px] [box-shadow:0_5px_18px_color-mix(in_oklab,_var(--foreground)_8%,_transparent)] z-[3] whitespace-nowrap max-[760px]:[&.label-focus]:right-[10px] max-[760px]:[&.label-focus]:top-[35px] max-[760px]:[&.label-neuron]:left-0 max-[760px]:[&.label-neuron]:bottom-[30px] max-[480px]:[&.label-neuron]:text-[7px] max-[480px]:[&.label-neuron]:left-[10px] max-[480px]:[&.label-neuron]:bottom-[23px] max-[480px]:[&.label-neuron]:p-2 label-neuron bottom-[35px] left-[22px] text-muted-foreground [transform:rotate(-4deg)] max-[1000px]:left-2 max-[1000px]:bottom-[37px] max-[1000px]:text-[8px] max-[1000px]:p-2">
            <span className="online-dot w-[6px] h-[6px] bg-sidebar-primary rounded-full inline-block shrink-0" />
            {t("neuronReady")}
          </div>
          <span className="hero-spark absolute text-muted-foreground text-[30px] spark-one top-[22px] left-5 max-[480px]:top-[5px] max-[480px]:left-7">
            ✦
          </span>
          <span className="hero-spark absolute text-muted-foreground text-[30px] spark-two bottom-[18px] right-8 text-[44px] text-muted-foreground max-[480px]:text-[25px] max-[480px]:right-[27px]">
            ✧
          </span>
        </div>
      </section>
      <div className="discovery-grid grid grid-cols-[minmax(0,_1fr)_250px] gap-[23px] mt-[26px] [&_>_.neuron-card]:mt-[39px] max-[1200px]:grid-cols-[minmax(0,_1fr)_220px] max-[1200px]:gap-[18px] max-[1000px]:grid-cols-[minmax(0,_1fr)] max-[1000px]:[&_>_.neuron-card]:hidden">
        <section>
          <div className="section-heading flex items-center justify-between gap-[10px] mb-4 [&_h2]:text-[15px] [&_h2]:tracking-[-0.3px] [&_h2]:font-semibold [&_h2]:flex [&_h2]:gap-2 [&_h2]:items-center [&_>_span]:text-[9px] [&_>_span]:text-muted-foreground [&_>_a]:text-[10px] [&_>_a]:text-muted-foreground [&_>_a]:flex [&_>_a]:items-center [&_>_a]:gap-[5px] max-[1200px]:[&_>_span]:hidden max-[760px]:[&_h2]:text-[15px] max-[480px]:[&_h2]:text-[14px]">
            <h2>
              {t("findSession")}{" "}
              <span className="section-count text-[9px] [background:color-mix(in_oklab,_var(--primary)_5%,_var(--card))] rounded-[5px] text-muted-foreground p-[3px_6px]">
                1
              </span>
            </h2>
            <span>{t("handpicked")}</span>
          </div>
          <ListingList />
          <Card className="block gap-0 ring-0 shadow-none listing-card bg-card [border:1px_solid_var(--border)] rounded-[15px] p-[22px] [box-shadow:0_3px_8px_color-mix(in_oklab,_var(--foreground)_1%,_transparent)] text-card-foreground [&_h3]:text-[16px] [&_h3]:leading-[1.6] [&_h3]:tracking-[-0.3px] [&_h3]:font-semibold [&_>_p]:text-[11px] [&_>_p]:text-muted-foreground [&_>_p]:leading-[1.9] [&_>_p]:mt-2 max-[480px]:p-[18px] max-[480px]:[&_h3]:text-[16px] max-[480px]:[&_>_p]:text-[11px]">
            <div className="listing-top flex justify-between items-center gap-[10px] mb-[17px] [&_.live-tag]:ml-auto">
              <Badge
                variant="secondary"
                className="subject-tag inline-flex items-center gap-[5px] text-[8px] bg-muted text-sidebar-primary p-[5px_8px] rounded-[5px]"
              >
                <GraduationCap size={14} />
                {t("technology")}
              </Badge>
              <span className="live-tag flex items-center gap-[5px] text-[8px] text-muted-foreground [&_.online-dot]:w-1 [&_.online-dot]:h-1">
                <span className="online-dot w-[6px] h-[6px] bg-sidebar-primary rounded-full inline-block shrink-0" />
                {t("joinNow")}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className={`favorite-toggle flex items-center justify-center ml-1 p-[7px] [border:1px_solid_var(--border)] rounded-[7px] bg-card text-muted-foreground [&.saved]:text-muted-foreground [&.saved]:bg-muted ${favorite ? "saved" : ""}`}
                aria-label={p(favorite ? "removeFavorite" : "addFavorite")}
                aria-pressed={favorite}
                onClick={() => setFavorite(!favorite)}
              >
                <Heart size={17} fill={favorite ? "currentColor" : "none"} />
              </Button>
            </div>
            <h3>{t("listingTitle")}</h3>
            <p>{t("listingDescription")}</p>
            <div className="listing-tags flex flex-wrap gap-[6px] m-[16px_0] [&_span]:text-[8px] [&_span]:text-muted-foreground [&_span]:[background:color-mix(in_oklab,_var(--primary)_4%,_var(--card))] [&_span]:p-[5px_7px] [&_span]:rounded-[4px]">
              <span>{t("aiEducation")}</span>
              <span>{t("englishRussian")}</span>
              <span>{t("allLevels")}</span>
            </div>
            <div className="listing-meta flex gap-[17px] text-muted-foreground text-[9px] [&_span]:flex [&_span]:items-center [&_span]:gap-[5px]">
              <span>
                <Users size={15} />
                {t("openGroup")}
              </span>
              <span>
                <Clock3 size={15} />
                {t("liveSession")}
              </span>
            </div>
            <div className="listing-bottom flex items-center justify-between [border-top:1px_solid_var(--border)] mt-[19px] pt-4 gap-[10px] max-[480px]:flex-wrap max-[480px]:gap-[14px] max-[480px]:[&_.secondary-button]:text-[10px]">
              <div className="host flex items-center gap-2 [&_strong]:block [&_strong]:text-[9px] [&_strong]:font-semibold [&_small]:block [&_small]:text-[8px] [&_small]:text-muted-foreground [&_small]:mt-1">
                <Avatar className="avatar inline-flex items-center justify-center bg-muted text-sidebar-primary rounded-full font-semibold shrink-0 [&.tiny]:h-8 [&.tiny]:w-8 [&.tiny]:text-[12px] [&.avatar-teal]:[background:color-mix(in_oklab,_var(--primary)_9%,_var(--card))] [&.avatar-teal]:text-muted-foreground [&.avatar-peach]:[background:color-mix(in_oklab,_var(--primary)_7%,_var(--card))] [&.avatar-peach]:text-primary [&.avatar-violet]:[background:color-mix(in_oklab,_var(--primary)_6%,_var(--card))] [&.avatar-violet]:text-primary host-avatar h-[29px] w-[29px] text-[11px] [background:color-mix(in_oklab,_var(--primary)_8%,_var(--card))]">
                  <AvatarFallback className="bg-transparent text-inherit [font-size:inherit]">
                    P
                  </AvatarFallback>
                </Avatar>
                <span>
                  <strong>{t("presenter")}</strong>
                  <small>{t("sessionHost")}</small>
                </span>
              </div>
              <JoinButton
                className="secondary-button min-h-10"
                label={t("joinConversation")}
              />
            </div>
          </Card>
        </section>
        <aside className="neuron-card [background:linear-gradient(_130deg,_color-mix(in_oklab,_var(--primary)_5%,_var(--card)),_color-mix(in_oklab,_var(--primary)_4%,_var(--card))_)] [border:1px_solid_var(--border)] rounded-[15px] p-[22px] h-[fit-content] [&_h3]:text-[17px] [&_h3]:leading-[1.5] [&_h3]:tracking-[-0.5px] [&_h3]:font-semibold [&_>_p]:text-[10px] [&_>_p]:text-muted-foreground [&_>_p]:leading-[1.9] [&_>_p]:mt-[10px] [&_ul]:[list-style:none] [&_ul]:p-0 [&_ul]:m-[18px_0] [&_ul]:grid [&_ul]:gap-[10px] [&_li]:flex [&_li]:gap-2 [&_li]:items-center [&_li]:text-muted-foreground [&_li]:text-[10px] [&_li_svg]:text-muted-foreground [&_>_a]:flex [&_>_a]:justify-between [&_>_a]:items-center [&_>_a]:text-[10px] [&_>_a]:font-semibold [&_>_a]:text-sidebar-primary [&_>_a]:[border-top:1px_solid_var(--border)] [&_>_a]:mt-[15px] [&_>_a]:pt-4 max-[1200px]:p-[18px]">
          <div className="neuron-card-top flex justify-between items-center mb-4">
            <span className="benefit-icon h-[37px] w-[37px] inline-flex items-center justify-center rounded-[11px] shrink-0 bg-muted text-sidebar-primary max-[1000px]:w-[30px] max-[1000px]:h-[30px] max-[1000px]:rounded-[9px] max-[1000px]:[&_svg]:w-[17px] max-[760px]:w-7 max-[760px]:h-7 max-[480px]:h-[31px] max-[480px]:w-[31px] violet [background:color-mix(in_oklab,_var(--primary)_5%,_var(--card))] text-primary">
              <Sparkles size={20} />
            </span>
            <span className="ai-pill text-[8px] text-muted-foreground [border:1px_solid_var(--border)] p-[3px_6px] rounded-[4px] tracking-[0.8px]">
              AI
            </span>
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
          <div className="neuron-example flex gap-[7px] items-start [background:color-mix(in_oklab,_var(--card)_66%,_transparent)] [border:1px_solid_var(--border)] rounded-[8px] p-[10px] text-[9px] leading-[1.8] text-muted-foreground [&_svg]:shrink-0 [&_svg]:mt-[2px]">
            <MessageCircle size={15} />
            <span>{t("neuronExample")}</span>
          </div>
          <Link href="/messages/study-group">
            {t("seeInAction")}
            <ArrowUpRight size={16} />
          </Link>
        </aside>
      </div>
      <section className="coming-section mt-4 product-tool-links [&_.coming-card]:block [&_.coming-card:hover]:border-border [&_.coming-card_h3]:text-foreground">
        <div className="section-heading flex items-center justify-between gap-[10px] mb-4 [&_h2]:text-[15px] [&_h2]:tracking-[-0.3px] [&_h2]:font-semibold [&_h2]:flex [&_h2]:gap-2 [&_h2]:items-center [&_>_span]:text-[9px] [&_>_span]:text-muted-foreground [&_>_a]:text-[10px] [&_>_a]:text-muted-foreground [&_>_a]:flex [&_>_a]:items-center [&_>_a]:gap-[5px] max-[1200px]:[&_>_span]:hidden max-[760px]:[&_h2]:text-[15px] max-[480px]:[&_h2]:text-[14px]">
          <h2>{p("learningTools")}</h2>
          <Link href="/sessions">
            {p("sessions")}
            <ArrowRight size={14} />
          </Link>
        </div>
        <div className="coming-grid grid grid-cols-[repeat(3,_1fr)] gap-[15px] max-[760px]:gap-[10px] max-[480px]:grid-cols-1">
          {[
            { icon: Users, title: "matching", text: "matchingText" },
            { icon: Timer, title: "studyRooms", text: "studyRoomsText" },
            { icon: FileText, title: "materials", text: "materialsText" },
          ].map(({ icon: Icon, title, text }) => (
            <Link
              href={title === "matching" ? "/profile" : "/sessions"}
              className="coming-card [border:1px_solid_var(--border)] rounded-[12px] [background:color-mix(in_oklab,_var(--card)_46%,_transparent)] p-[18px] relative [&_>_svg]:text-muted-foreground [&_h3]:text-[11px] [&_h3]:text-muted-foreground [&_h3]:m-[13px_0_7px] [&_h3]:font-semibold [&_p]:text-[9px] [&_p]:text-muted-foreground [&_p]:leading-[1.8] max-[1000px]:p-[14px] max-[1000px]:[&_h3]:text-[10px] max-[760px]:[&_h3]:text-[10px] max-[760px]:[&_p]:text-[9px] max-[480px]:p-[17px] max-[480px]:[&_h3]:text-[12px] max-[480px]:[&_h3]:mt-[10px] max-[480px]:[&_p]:text-[10px]"
              key={title}
            >
              <Icon size={21} />
              <Badge
                variant="secondary"
                className="coming-badge [float:right] text-muted-foreground [background:color-mix(in_oklab,_var(--primary)_5%,_var(--card))] text-[7px] tracking-[0.7px] p-[4px_6px] rounded-[4px] max-[480px]:text-[8px]"
              >
                {p(title === "matching" ? "yourInterests" : "inDevelopment")}
              </Badge>
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
    <main className="page max-w-[1270px] w-full mx-auto p-[37px_48px_35px] flex-1 max-[1200px]:p-[30px] max-[1000px]:p-[26px] max-[760px]:p-[25px_20px] max-[480px]:p-[23px_17px]">
      <div className="page-heading flex justify-between items-center mb-[26px] gap-4 [&_h1]:text-[29px] [&_h1]:font-medium [&_h1]:tracking-[-1.2px] [&_h1]:leading-[1.4] [&_h1_>_span]:font-bold [&_p]:text-[12px] [&_p]:text-muted-foreground [&_p]:mt-[6px] [&_p]:leading-[1.7] max-[760px]:mb-[22px] max-[760px]:[&_h1]:text-[26px] max-[760px]:[&_p]:text-[11px] max-[480px]:[&_h1]:text-[23px] max-[480px]:[&_h1]:tracking-[-0.9px] max-[480px]:[&_h1]:leading-[1.4] max-[480px]:[&_p]:text-[10px] max-[760px]:[&_>_.primary-button]:text-[10px] max-[760px]:[&_>_.primary-button]:p-[9px] max-[760px]:[&_>_.primary-button]:gap-[5px]">
        <div>
          <div className="eyebrow flex gap-[7px] items-center tracking-[1.5px] text-[9px] font-semibold text-muted-foreground mb-[10px] [&_.online-dot]:w-[5px] [&_.online-dot]:h-[5px] max-[480px]:text-[8px]">
            <BookOpen size={16} />
            PairUp
          </div>
          <h1>{t("nextChapter")}</h1>
          <p>{t("roadmapText")}</p>
        </div>
      </div>
      <div className="coming-grid grid grid-cols-[repeat(3,_1fr)] gap-[15px] max-[760px]:gap-[10px] max-[480px]:grid-cols-1">
        {["matching", "studyRooms", "materials"].map((key) => (
          <Card
            className="block gap-0 ring-0 shadow-none coming-card [border:1px_solid_var(--border)] rounded-[12px] [background:color-mix(in_oklab,_var(--card)_46%,_transparent)] p-[18px] relative [&_>_svg]:text-muted-foreground [&_h3]:text-[11px] [&_h3]:text-muted-foreground [&_h3]:m-[13px_0_7px] [&_h3]:font-semibold [&_p]:text-[9px] [&_p]:text-muted-foreground [&_p]:leading-[1.8] max-[1000px]:p-[14px] max-[1000px]:[&_h3]:text-[10px] max-[760px]:[&_h3]:text-[10px] max-[760px]:[&_p]:text-[9px] max-[480px]:p-[17px] max-[480px]:[&_h3]:text-[12px] max-[480px]:[&_h3]:mt-[10px] max-[480px]:[&_p]:text-[10px]"
            key={key}
          >
            <Sparkles />
            <Badge
              variant="secondary"
              className="coming-badge [float:right] text-muted-foreground [background:color-mix(in_oklab,_var(--primary)_5%,_var(--card))] text-[7px] tracking-[0.7px] p-[4px_6px] rounded-[4px] max-[480px]:text-[8px]"
            >
              {t("comingSoon")}
            </Badge>
            <h3>{t(key)}</h3>
            <p>{t(`${key}Text`)}</p>
          </Card>
        ))}
      </div>
      <div className="roadmap-cta mt-[30px]">
        <JoinButton />
      </div>
    </main>
  );
}
