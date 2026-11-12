"use client";
import { Badge } from "./ui/badge";
import { Card } from "./ui/card";
import Link from "next/link";
import { ListingList } from "./listing-list";
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
import { Button } from "./ui/button";
import { JoinButton } from "./discover";
import { LanguageSwitcher } from "./shell";
import { ThemeToggle } from "./theme-toggle";

export { CreateListing } from "./create-listing";

export function Conversations() {
  const t = useTranslations("Product");
  const d = useTranslations("Demo");
  const format = useFormatter();
  const { messages } = useAppSelector((s) => s.chat);
  const last = messages.at(-1);
  return (
    <main className="page max-w-[1270px] w-full mx-auto p-[37px_48px_35px] flex-1 max-[1200px]:p-[30px] max-[1000px]:p-[26px] max-[760px]:p-[25px_20px] max-[480px]:p-[23px_17px]">
      <div className="page-heading flex justify-between items-center mb-[26px] gap-4 [&_h1]:text-[29px] [&_h1]:font-medium [&_h1]:tracking-[-1.2px] [&_h1]:leading-[1.4] [&_h1_>_span]:font-bold [&_p]:text-[12px] [&_p]:text-muted-foreground [&_p]:mt-[6px] [&_p]:leading-[1.7] max-[760px]:mb-[22px] max-[760px]:[&_h1]:text-[26px] max-[760px]:[&_p]:text-[11px] max-[480px]:[&_h1]:text-[23px] max-[480px]:[&_h1]:tracking-[-0.9px] max-[480px]:[&_h1]:leading-[1.4] max-[480px]:[&_p]:text-[10px] max-[760px]:[&_>_.primary-button]:text-[10px] max-[760px]:[&_>_.primary-button]:p-[9px] max-[760px]:[&_>_.primary-button]:gap-[5px]">
        <div>
          <div className="eyebrow flex gap-[7px] items-center tracking-[1.5px] text-[9px] font-semibold text-muted-foreground mb-[10px] [&_.online-dot]:w-[5px] [&_.online-dot]:h-[5px] max-[480px]:text-[8px]">
            <MessageCircle size={16} />
            {t("yourConversations")}
          </div>
          <h1>{d("messages")}</h1>
          <p>{t("messagesText")}</p>
        </div>
      </div>
      <section className="conversation-list bg-card [border:1px_solid_var(--border)] rounded-[16px]">
        <Link
          href="/messages/study-group"
          className="conversation-card flex items-center gap-4 p-[25px] rounded-[16px] [&:hover]:bg-muted [&_>_div]:flex-1 [&_>_div]:min-w-0 [&_p]:text-[12px] [&_p]:leading-[1.8] [&_p]:text-muted-foreground [&_p]:overflow-hidden [&_p]:whitespace-nowrap [&_p]:[text-overflow:ellipsis] [&_p]:m-[8px_0_12px] [&_>_svg]:text-muted-foreground max-[760px]:p-[20px_16px] max-[760px]:gap-[10px]"
        >
          <span className="room-icon flex items-center justify-center w-[43px] h-[43px] rounded-[13px] [background:color-mix(in_oklab,_var(--primary)_5%,_var(--card))] text-primary shrink-0 max-[480px]:h-[35px] max-[480px]:w-[35px]">
            <BookOpen size={24} />
          </span>
          <div>
            <div className="conversation-title flex items-center justify-between gap-3 [&_h2]:text-[15px] [&_h2]:font-semibold [&_time]:text-[10px] [&_time]:text-muted-foreground [&_time]:shrink-0 max-[760px]:[&_h2]:text-[14px]">
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
            <Badge
              variant="secondary"
              className="subject-tag inline-flex items-center gap-[5px] text-[8px] bg-muted text-sidebar-primary p-[5px_8px] rounded-[5px]"
            >
              {t("groupConversation")}
            </Badge>
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
    <main className="page max-w-[1270px] w-full mx-auto p-[37px_48px_35px] flex-1 max-[1200px]:p-[30px] max-[1000px]:p-[26px] max-[760px]:p-[25px_20px] max-[480px]:p-[23px_17px]">
      <div className="page-heading flex justify-between items-center mb-[26px] gap-4 [&_h1]:text-[29px] [&_h1]:font-medium [&_h1]:tracking-[-1.2px] [&_h1]:leading-[1.4] [&_h1_>_span]:font-bold [&_p]:text-[12px] [&_p]:text-muted-foreground [&_p]:mt-[6px] [&_p]:leading-[1.7] max-[760px]:mb-[22px] max-[760px]:[&_h1]:text-[26px] max-[760px]:[&_p]:text-[11px] max-[480px]:[&_h1]:text-[23px] max-[480px]:[&_h1]:tracking-[-0.9px] max-[480px]:[&_h1]:leading-[1.4] max-[480px]:[&_p]:text-[10px] max-[760px]:[&_>_.primary-button]:text-[10px] max-[760px]:[&_>_.primary-button]:p-[9px] max-[760px]:[&_>_.primary-button]:gap-[5px]">
        <div>
          <div className="eyebrow flex gap-[7px] items-center tracking-[1.5px] text-[9px] font-semibold text-muted-foreground mb-[10px] [&_.online-dot]:w-[5px] [&_.online-dot]:h-[5px] max-[480px]:text-[8px]">
            <Bell size={16} />
            {t("stayUpdated")}
          </div>
          <h1>{t("notifications")}</h1>
          <p>{t("notificationsText")}</p>
        </div>
        {unread > 0 && (
          <Button
            variant="secondary"
            className="secondary-button min-h-10"
            onClick={markRead}
          >
            <CheckCheck size={16} />
            {t("markAllRead")}
          </Button>
        )}
      </div>
      {latest ? (
        <section className="notification-list bg-card [border:1px_solid_var(--border)] rounded-[16px]">
          <Link
            href="/messages/study-group"
            className={`notification-row p-[21px] flex items-start gap-[13px] [border-bottom:1px_solid_var(--border)] [&:last-child]:border-0 [&.unread]:bg-muted [&_>_div]:flex-1 [&_>_div]:min-w-0 [&_h2]:flex [&_h2]:justify-between [&_h2]:gap-3 [&_h2]:items-center [&_h2]:text-[12px] [&_h2]:font-semibold [&_time]:text-[10px] [&_time]:font-normal [&_time]:text-muted-foreground [&_time]:shrink-0 [&_p]:text-[12px] [&_p]:leading-[1.8] [&_p]:text-muted-foreground [&_p]:whitespace-pre-wrap [&_p]:[overflow-wrap:anywhere] [&_p]:mt-[6px] [&_p]:[display:-webkit-box] [&_p]:[-webkit-line-clamp:3] [&_p]:[-webkit-box-orient:vertical] [&_p]:overflow-hidden [&_.nav-dot]:mt-2 max-[760px]:p-[17px_13px] max-[760px]:gap-[9px] max-[760px]:[&_h2]:items-start max-[760px]:[&_h2]:flex-col max-[760px]:[&_h2]:gap-1 ${unread > 0 ? "unread" : ""}`}
            onClick={markRead}
          >
            <span className="benefit-icon h-[37px] w-[37px] inline-flex items-center justify-center rounded-[11px] shrink-0 bg-muted text-sidebar-primary max-[1000px]:w-[30px] max-[1000px]:h-[30px] max-[1000px]:rounded-[9px] max-[1000px]:[&_svg]:w-[17px] max-[760px]:w-7 max-[760px]:h-7 max-[480px]:h-[31px] max-[480px]:w-[31px] violet [background:color-mix(in_oklab,_var(--primary)_5%,_var(--card))] text-primary">
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
            {unread > 0 && (
              <span className="nav-dot ml-auto w-[5px] h-[5px] rounded-full bg-primary" />
            )}
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
    <Card className="block gap-0 ring-0 shadow-none empty-state bg-card [border:1px_solid_var(--border)] rounded-[17px] text-center p-[55px_25px] [&_h2]:text-[20px] [&_h2]:font-semibold [&_h2]:leading-[1.5] [&_p]:text-[13px] [&_p]:leading-[1.9] [&_p]:text-muted-foreground [&_p]:max-w-[490px] [&_p]:m-[12px_auto_0] [&_.secondary-button]:mt-5 max-[760px]:p-[40px_20px] max-[760px]:[&_h2]:text-[18px]">
      <span className="empty-icon inline-flex items-center justify-center bg-muted text-primary w-[65px] h-[65px] rounded-[20px] mb-[22px]">
        <Icon size={28} />
      </span>
      <h2>{title}</h2>
      <p>{text}</p>
      {children}
    </Card>
  );
}

export function MyListings({ publishedId }: { publishedId?: string }) {
  const t = useTranslations("Product");
  return (
    <main className="page max-w-[1270px] w-full mx-auto p-[37px_48px_35px] flex-1 max-[1200px]:p-[30px] max-[1000px]:p-[26px] max-[760px]:p-[25px_20px] max-[480px]:p-[23px_17px]">
      <div className="page-heading flex justify-between items-center mb-[26px] gap-4 [&_h1]:text-[29px] [&_h1]:font-medium [&_h1]:tracking-[-1.2px] [&_h1]:leading-[1.4] [&_h1_>_span]:font-bold [&_p]:text-[12px] [&_p]:text-muted-foreground [&_p]:mt-[6px] [&_p]:leading-[1.7] max-[760px]:mb-[22px] max-[760px]:[&_h1]:text-[26px] max-[760px]:[&_p]:text-[11px] max-[480px]:[&_h1]:text-[23px] max-[480px]:[&_h1]:tracking-[-0.9px] max-[480px]:[&_h1]:leading-[1.4] max-[480px]:[&_p]:text-[10px] max-[760px]:[&_>_.primary-button]:text-[10px] max-[760px]:[&_>_.primary-button]:p-[9px] max-[760px]:[&_>_.primary-button]:gap-[5px]">
        <div>
          <h1>{t("myListings")}</h1>
          <p>{t("myListingsText")}</p>
        </div>
        <Button
          nativeButton={false}
          render={<Link href="/create" />}
          variant="default"
          className="primary-button min-h-10"
        >
          <PlusCircle size={16} />
          {t("create")}
        </Button>
      </div>
      <ListingList
        mine
        publishedId={publishedId}
        empty={
          <EmptyState
            icon={FileText}
            title={t("noListings")}
            text={t("noListingsText")}
          >
            <Button
              nativeButton={false}
              render={<Link href="/create" />}
              variant="secondary"
              className="secondary-button min-h-10"
            >
              {t("create")}
            </Button>
          </EmptyState>
        }
      />
    </main>
  );
}
export function Favorites() {
  const t = useTranslations("Product");
  const d = useTranslations("Demo");
  const [favorite] = useBrowserStorage("pairup.favorite.demo-listing", false);
  return (
    <main className="page max-w-[1270px] w-full mx-auto p-[37px_48px_35px] flex-1 max-[1200px]:p-[30px] max-[1000px]:p-[26px] max-[760px]:p-[25px_20px] max-[480px]:p-[23px_17px]">
      <div className="page-heading flex justify-between items-center mb-[26px] gap-4 [&_h1]:text-[29px] [&_h1]:font-medium [&_h1]:tracking-[-1.2px] [&_h1]:leading-[1.4] [&_h1_>_span]:font-bold [&_p]:text-[12px] [&_p]:text-muted-foreground [&_p]:mt-[6px] [&_p]:leading-[1.7] max-[760px]:mb-[22px] max-[760px]:[&_h1]:text-[26px] max-[760px]:[&_p]:text-[11px] max-[480px]:[&_h1]:text-[23px] max-[480px]:[&_h1]:tracking-[-0.9px] max-[480px]:[&_h1]:leading-[1.4] max-[480px]:[&_p]:text-[10px] max-[760px]:[&_>_.primary-button]:text-[10px] max-[760px]:[&_>_.primary-button]:p-[9px] max-[760px]:[&_>_.primary-button]:gap-[5px]">
        <div>
          <h1>{t("favorites")}</h1>
          <p>{t("favoritesText")}</p>
        </div>
      </div>
      {favorite ? (
        <Card className="block gap-0 ring-0 shadow-none listing-card bg-card [border:1px_solid_var(--border)] rounded-[15px] p-[22px] [box-shadow:0_3px_8px_color-mix(in_oklab,_var(--foreground)_1%,_transparent)] text-card-foreground [&_h3]:text-[16px] [&_h3]:leading-[1.6] [&_h3]:tracking-[-0.3px] [&_h3]:font-semibold [&_>_p]:text-[11px] [&_>_p]:text-muted-foreground [&_>_p]:leading-[1.9] [&_>_p]:mt-2 max-[480px]:p-[18px] max-[480px]:[&_h3]:text-[16px] max-[480px]:[&_>_p]:text-[11px] favorite-card max-w-190">
          <Badge
            variant="secondary"
            className="subject-tag inline-flex items-center gap-[5px] text-[8px] bg-muted text-sidebar-primary p-[5px_8px] rounded-[5px]"
          >
            {d("technology")}
          </Badge>
          <h3>{d("listingTitle")}</h3>
          <p>{d("listingDescription")}</p>
          <div className="roadmap-cta mt-[30px]">
            <JoinButton />
          </div>
        </Card>
      ) : (
        <EmptyState
          icon={Heart}
          title={t("noFavorites")}
          text={t("noFavoritesText")}
        >
          <Button
            nativeButton={false}
            render={<Link href="/" />}
            variant="secondary"
            className="secondary-button min-h-10"
          >
            {d("discover")}
          </Button>
        </EmptyState>
      )}
    </main>
  );
}
export function SettingsPage() {
  const t = useTranslations("Product");
  return (
    <main className="page max-w-250 w-full mx-auto p-[37px_48px_35px] flex-1 max-[1200px]:p-[30px] max-[1000px]:p-[26px] max-[760px]:p-[25px_20px] max-[480px]:p-[23px_17px] form-page">
      <div className="page-heading flex justify-between items-center mb-[26px] gap-4 [&_h1]:text-[29px] [&_h1]:font-medium [&_h1]:tracking-[-1.2px] [&_h1]:leading-[1.4] [&_h1_>_span]:font-bold [&_p]:text-[12px] [&_p]:text-muted-foreground [&_p]:mt-[6px] [&_p]:leading-[1.7] max-[760px]:mb-[22px] max-[760px]:[&_h1]:text-[26px] max-[760px]:[&_p]:text-[11px] max-[480px]:[&_h1]:text-[23px] max-[480px]:[&_h1]:tracking-[-0.9px] max-[480px]:[&_h1]:leading-[1.4] max-[480px]:[&_p]:text-[10px] max-[760px]:[&_>_.primary-button]:text-[10px] max-[760px]:[&_>_.primary-button]:p-[9px] max-[760px]:[&_>_.primary-button]:gap-[5px]">
        <div>
          <div className="eyebrow flex gap-[7px] items-center tracking-[1.5px] text-[9px] font-semibold text-muted-foreground mb-[10px] [&_.online-dot]:w-[5px] [&_.online-dot]:h-[5px] max-[480px]:text-[8px]">
            <Settings size={16} />
            PairUp
          </div>
          <h1>{t("settings")}</h1>
          <p>{t("settingsText")}</p>
        </div>
      </div>
      <Card className="block gap-0 ring-0 shadow-none settings-card bg-card [border:1px_solid_var(--border)] rounded-[16px] p-[25px] mb-5 text-card-foreground [&_h2]:text-[16px] [&_h2]:font-semibold [&_h2]:mb-[15px] [&_>_p]:text-[12px] [&_>_p]:leading-[1.8] [&_>_p]:text-muted-foreground [&_>_p]:m-[0_0_20px] [&_.locale-switch]:inline-flex [&_.locale-switch]:[border:1px_solid_var(--border)] [&_.locale-switch]:rounded-[8px] [&_.locale-switch]:p-[5px] [&_.locale-switch_button]:p-[9px_14px] [&_.locale-switch_button]:text-[12px]">
        <h2>{t("appearance")}</h2>
        <p>{t("appearanceText")}</p>
        <ThemeToggle expanded />
      </Card>
      <Card className="block gap-0 ring-0 shadow-none settings-card bg-card [border:1px_solid_var(--border)] rounded-[16px] p-[25px] mb-5 text-card-foreground [&_h2]:text-[16px] [&_h2]:font-semibold [&_h2]:mb-[15px] [&_>_p]:text-[12px] [&_>_p]:leading-[1.8] [&_>_p]:text-muted-foreground [&_>_p]:m-[0_0_20px] [&_.locale-switch]:inline-flex [&_.locale-switch]:[border:1px_solid_var(--border)] [&_.locale-switch]:rounded-[8px] [&_.locale-switch]:p-[5px] [&_.locale-switch_button]:p-[9px_14px] [&_.locale-switch_button]:text-[12px]">
        <h2>{t("interfaceLanguage")}</h2>
        <p>{t("languageText")}</p>
        <LanguageSwitcher />
      </Card>
    </main>
  );
}
export function Sessions() {
  const t = useTranslations("Product");
  return (
    <main className="page max-w-[1270px] w-full mx-auto p-[37px_48px_35px] flex-1 max-[1200px]:p-[30px] max-[1000px]:p-[26px] max-[760px]:p-[25px_20px] max-[480px]:p-[23px_17px]">
      <div className="page-heading flex justify-between items-center mb-[26px] gap-4 [&_h1]:text-[29px] [&_h1]:font-medium [&_h1]:tracking-[-1.2px] [&_h1]:leading-[1.4] [&_h1_>_span]:font-bold [&_p]:text-[12px] [&_p]:text-muted-foreground [&_p]:mt-[6px] [&_p]:leading-[1.7] max-[760px]:mb-[22px] max-[760px]:[&_h1]:text-[26px] max-[760px]:[&_p]:text-[11px] max-[480px]:[&_h1]:text-[23px] max-[480px]:[&_h1]:tracking-[-0.9px] max-[480px]:[&_h1]:leading-[1.4] max-[480px]:[&_p]:text-[10px] max-[760px]:[&_>_.primary-button]:text-[10px] max-[760px]:[&_>_.primary-button]:p-[9px] max-[760px]:[&_>_.primary-button]:gap-[5px]">
        <div>
          <div className="eyebrow flex gap-[7px] items-center tracking-[1.5px] text-[9px] font-semibold text-muted-foreground mb-[10px] [&_.online-dot]:w-[5px] [&_.online-dot]:h-[5px] max-[480px]:text-[8px]">
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
      <div className="coming-grid grid grid-cols-[repeat(3,_1fr)] gap-[15px] max-[760px]:gap-[10px] max-[480px]:grid-cols-1 session-tools mt-[23px]">
        {["notes", "tasks", "pomodoro"].map((key) => (
          <Card
            className="block gap-0 ring-0 shadow-none coming-card [border:1px_solid_var(--border)] rounded-[12px] [background:color-mix(in_oklab,_var(--card)_46%,_transparent)] p-[18px] relative [&_>_svg]:text-muted-foreground [&_h3]:text-[11px] [&_h3]:text-muted-foreground [&_h3]:m-[13px_0_7px] [&_h3]:font-semibold [&_p]:text-[9px] [&_p]:text-muted-foreground [&_p]:leading-[1.8] max-[1000px]:p-[14px] max-[1000px]:[&_h3]:text-[10px] max-[760px]:[&_h3]:text-[10px] max-[760px]:[&_p]:text-[9px] max-[480px]:p-[17px] max-[480px]:[&_h3]:text-[12px] max-[480px]:[&_h3]:mt-[10px] max-[480px]:[&_p]:text-[10px]"
            key={key}
          >
            <Sparkles size={21} />
            <Badge
              variant="secondary"
              className="coming-badge [float:right] text-muted-foreground [background:color-mix(in_oklab,_var(--primary)_5%,_var(--card))] text-[7px] tracking-[0.7px] p-[4px_6px] rounded-[4px] max-[480px]:text-[8px]"
            >
              {t("inDevelopment")}
            </Badge>
            <h3>{t(key)}</h3>
            <p>{t(`${key}Text`)}</p>
          </Card>
        ))}
      </div>
    </main>
  );
}
