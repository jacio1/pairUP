"use client";
import { Badge } from "./ui/badge";
import { Card } from "./ui/card";
import { Avatar, AvatarFallback } from "./ui/avatar";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "./ui/alert-dialog";
import { Button } from "./ui/button";
import { useEffect, useRef, useState, type SubmitEvent } from "react";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import {
  ArrowUp,
  ChevronLeft,
  GraduationCap,
  MessageCircle,
  RotateCcw,
  Sparkles,
  Trash2,
  Users,
  WifiOff,
  X,
} from "lucide-react";
import Link from "next/link";
import {
  actions,
  type Message,
  useAskMutation,
  useResetMutation,
} from "@/lib/store";
import { chatSocket, useAppDispatch, useAppSelector } from "./providers";
import { JoinButton, NeuronArt, errorCode } from "./discover";
import { Input } from "./ui/input";

export function ChatRoom() {
  const t = useTranslations("Demo");
  const errors = useTranslations("Errors");
  const locale = useLocale();
  const format = useFormatter();
  const { session, messages, connected, draft, aiDraft, aiMode, target, ai } =
    useAppSelector((s) => s.chat);
  const dispatch = useAppDispatch();
  const [ask, { isLoading: asking }] = useAskMutation();
  const [reset] = useResetMutation();
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [confirmReset, setConfirmReset] = useState(false);
  const end = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const pendingSend = useRef<{ text: string; id: string } | null>(null);
  const pendingAsk = useRef<{
    text: string;
    locale: string;
    target?: string;
    id: string;
  } | null>(null);
  const busy = ai?.status === "running" || ai?.status === "pending";
  const presenter = session?.role === "presenter";
  useEffect(() => {
    end.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, busy]);
  function mode(message?: Message) {
    dispatch(actions.mode({ enabled: true, target: message }));
    input.current?.focus();
  }
  function retryAi() {
    const request = messages
      .filter((message) => message.kind === "ai-request")
      .at(-1);
    if (request) dispatch(actions.aiDraft(request.text));
    mode(messages.find((message) => message.id === request?.targetMessageId));
  }
  async function send(e?: SubmitEvent<HTMLFormElement>) {
    e?.preventDefault();
    const text = (aiMode ? aiDraft : draft).trim();
    if (!text || sending || asking || !connected || (aiMode && busy)) return;
    setError("");
    if (aiMode) {
      const previous = pendingAsk.current;
      const request =
        previous?.text === text &&
        previous.locale === locale &&
        previous.target === target?.id
          ? previous
          : { text, locale, target: target?.id, id: crypto.randomUUID() };
      pendingAsk.current = request;
      try {
        const job = await ask({
          clientRequestId: request.id,
          prompt: text,
          locale,
          targetMessageId: target?.id,
        }).unwrap();
        pendingAsk.current = null;
        dispatch(actions.ai(job));
        dispatch(actions.clearSentDraft({ ai: true, text }));
        dispatch(actions.mode({ enabled: false }));
      } catch (e) {
        setError(errorCode(e));
      }
      return;
    }
    const request =
      pendingSend.current?.text === text
        ? pendingSend.current
        : { text, id: crypto.randomUUID() };
    pendingSend.current = request;
    setSending(true);
    chatSocket
      ?.timeout(8000)
      .emit(
        "message:send",
        { text, clientRequestId: request.id },
        (
          err: Error | null,
          response: { ok: boolean; code?: string; message?: Message },
        ) => {
          setSending(false);
          if (err || !response?.ok) {
            setError(response?.code || "DELIVERY_FAILED");
            return;
          }
          pendingSend.current = null;
          if (response.message) dispatch(actions.merge([response.message]));
          dispatch(actions.clearSentDraft({ ai: false, text }));
        },
      );
  }
  async function clear() {
    try {
      await reset().unwrap();
      setConfirmReset(false);
      setError("");
    } catch (e) {
      setError(errorCode(e));
    }
  }
  if (!session)
    return (
      <main className="page max-w-[1270px] w-full mx-auto p-[37px_48px_35px] flex-1 max-[1200px]:p-[30px] max-[1000px]:p-[26px] max-[760px]:p-[25px_20px] max-[480px]:p-[23px_17px]">
        <section className="chat-gate max-w-140 text-center m-[30px_auto] [&_h1]:text-[30px] [&_h1]:tracking-[-1px] [&_h1]:m-[10px_0] [&_>_p]:text-[14px] [&_>_p]:text-muted-foreground [&_>_p]:leading-[1.8] [&_>_p]:mb-6 max-[760px]:mx-auto max-[760px]:[&_h1]:text-[26px]">
          <NeuronArt small />
          <Badge
            variant="secondary"
            className="hero-badge inline-flex items-center gap-[6px] text-[8px] font-semibold tracking-[1px] text-sidebar-primary [background:color-mix(in_oklab,_var(--card)_71%,_transparent)] [border:1px_solid_var(--border)] rounded-[6px] p-[6px_8px] mb-4 max-[760px]:text-[7px] max-[480px]:mb-[14px]"
          >
            <MessageCircle size={15} />
            {t("liveDemo")}
          </Badge>
          <h1>{t("joinChatTitle")}</h1>
          <p>{t("joinChatText")}</p>
          <JoinButton />
        </section>
      </main>
    );
  return (
    <main className="page max-w-[1270px] w-full mx-auto p-[37px_48px_35px] flex-1 max-[1200px]:p-[30px] max-[1000px]:p-[26px] max-[760px]:p-[25px_20px] max-[480px]:p-[23px_17px] chat-page max-[760px]:p-[17px_15px_0] max-[480px]:p-[15px_10px_0] pb-5">
      <Link
        className="back-link inline-flex items-center gap-1 text-muted-foreground text-[11px] mb-5 max-[760px]:mb-[13px]"
        href="/messages"
      >
        <ChevronLeft size={16} />
        {t("backDiscover")}
      </Link>
      <div className="chat-layout grid grid-cols-[minmax(0,_1fr)_230px] gap-[22px] max-[1200px]:grid-cols-[minmax(0,_1fr)_205px] max-[1000px]:grid-cols-[minmax(0,_1fr)]">
        <section className="chat-panel bg-card [border:1px_solid_var(--border)] rounded-[17px] overflow-hidden flex flex-col h-[calc(100dvh_-_180px)] min-h-120 max-h-225 text-card-foreground max-[1000px]:h-[calc(100dvh_-_190px)] max-[760px]:h-[calc(100dvh_-_175px)] max-[760px]:min-h-85 max-[480px]:h-[calc(100dvh_-_193px)]">
          <header className="chat-header flex items-center gap-3 p-[19px_22px] [border-bottom:1px_solid_var(--border)] [&_h1]:text-[15px] [&_h1]:font-semibold [&_p]:text-[9px] [&_p]:text-muted-foreground [&_p]:flex [&_p]:gap-[7px] [&_p]:items-center [&_p]:mt-[5px] [&_.online-dot]:h-[5px] [&_.online-dot]:w-[5px] max-[1200px]:p-[15px] max-[760px]:p-[12px_15px] max-[760px]:[&_h1]:text-[14px] max-[760px]:[&_p]:text-[8px] max-[480px]:[&_h1]:text-[13px] max-[480px]:gap-[9px]">
            <span className="room-icon flex items-center justify-center w-[43px] h-[43px] rounded-[13px] [background:color-mix(in_oklab,_var(--primary)_5%,_var(--card))] text-primary shrink-0 max-[480px]:h-[35px] max-[480px]:w-[35px]">
              <GraduationCap size={25} />
            </span>
            <div>
              <h1>{t("chatTitle")}</h1>
              <p>
                <span
                  className={
                    connected
                      ? "online-dot w-[6px] h-[6px] bg-sidebar-primary rounded-full inline-block shrink-0"
                      : "offline-dot w-[6px] h-[6px] bg-primary rounded-full inline-block shrink-0"
                  }
                />
                <span role="status">
                  {t(connected ? "connected" : "reconnecting")}
                </span>
                <span>·</span>
                {t("openGroup")}
              </p>
            </div>
            {presenter && (
              <Button
                variant="ghost"
                size="icon"
                className="icon-button inline-flex items-center justify-center bg-transparent text-muted-foreground p-[6px] rounded-[6px] [&:hover]:[background:color-mix(in_oklab,_var(--primary)_5%,_var(--card))] clear-button ml-auto"
                aria-label={t("clearChat")}
                title={t("clearChat")}
                onClick={() => setConfirmReset(true)}
              >
                <Trash2 size={17} />
              </Button>
            )}
          </header>
          <div
            className="chat-messages flex-1 min-h-0 overflow-y-auto [overscroll-behavior:contain] p-[22px] [scrollbar-width:thin] [scrollbar-color:var(--primary)_transparent] max-[760px]:p-[15px]"
            role="log"
            aria-label={t("messages")}
            aria-live="polite"
          >
            <div className="room-welcome text-center p-[20px_10px_30px] [&_h2]:text-[14px] [&_h2]:[font-weight:550] [&_h2]:mb-2 [&_p]:text-[11px] [&_p]:text-muted-foreground [&_p]:leading-[1.8] [&_p]:max-w-[350px] [&_p]:m-auto max-[480px]:[&_h2]:text-[13px] max-[480px]:[&_p]:text-[10px]">
              <span className="small-neuron h-[41px] w-[41px] rounded-[13px] bg-muted text-sidebar-primary inline-flex items-center justify-center mb-[13px]">
                <Sparkles size={22} />
              </span>
              <h2>{t("roomWelcome")}</h2>
              <p>{t("roomWelcomeText")}</p>
            </div>
            {messages.map((message) => {
              const mine = message.sessionId === session.id;
              const neuron = message.kind === "ai";
              const parent = messages.find(
                (m) => m.id === message.targetMessageId,
              );
              return (
                <article
                  key={message.id}
                  className={`message-row flex gap-[9px] mb-[19px] [&.mine]:[flex-direction:row-reverse] max-[480px]:gap-[6px] ${mine ? "mine [&_.message-meta]:justify-end [&_.message-bubble]:bg-primary [&_.message-bubble]:border-primary [&_.message-bubble]:rounded-[11px_0_11px_11px] [&_.message-bubble]:text-primary-foreground [&_.message-ask]:ml-auto [&_.message-bubble_blockquote]:text-primary-foreground [&_.message-bubble_blockquote]:[background:color-mix(in_oklab,_var(--primary-foreground)_10%,_transparent)] [&_.message-bubble_blockquote]:border-primary-foreground" : ""} ${neuron ? "neuron-message [&_.message-bubble]:[background:linear-gradient(_125deg,_color-mix(in_oklab,_var(--primary)_5%,_var(--card)),_color-mix(in_oklab,_var(--primary)_4%,_var(--card))_)] [&_.message-bubble]:border-border [&_.message-bubble]:text-foreground" : ""}`}
                >
                  <Avatar
                    className={`avatar inline-flex items-center justify-center bg-muted text-sidebar-primary rounded-full font-semibold shrink-0 [&.tiny]:h-8 [&.tiny]:w-8 [&.tiny]:text-[12px] [&.avatar-teal]:[background:color-mix(in_oklab,_var(--primary)_9%,_var(--card))] [&.avatar-teal]:text-muted-foreground [&.avatar-peach]:[background:color-mix(in_oklab,_var(--primary)_7%,_var(--card))] [&.avatar-peach]:text-primary [&.avatar-violet]:[background:color-mix(in_oklab,_var(--primary)_6%,_var(--card))] [&.avatar-violet]:text-primary message-avatar w-7 h-7 text-[10px] mt-[3px] max-[480px]:w-6 max-[480px]:h-6 max-[480px]:text-[9px] ${neuron ? "neuron-avatar text-primary [background:color-mix(in_oklab,_var(--primary)_6%,_var(--card))]" : ""}`}
                  >
                    <AvatarFallback className="bg-transparent text-inherit [font-size:inherit]">
                      {neuron ? (
                        <Sparkles size={17} />
                      ) : message.author.startsWith("TEST") ? (
                        "T"
                      ) : (
                        "P"
                      )}
                    </AvatarFallback>
                  </Avatar>
                  <div className="message-body min-w-0 max-w-[85%] max-[480px]:max-w-[88%]">
                    <div className="message-meta flex items-center gap-2 flex-wrap text-[9px] mb-[6px] [&_strong]:font-semibold [&_strong]:text-muted-foreground [&_time]:text-[8px] [&_time]:text-muted-foreground">
                      <strong>{neuron ? t("neuron") : message.author}</strong>
                      {message.kind === "ai-request" && (
                        <Badge
                          variant="secondary"
                          className="request-tag flex items-center gap-[3px] text-[7px] text-primary"
                        >
                          <Sparkles size={11} />
                          {t("askedNeuron")}
                        </Badge>
                      )}
                      <time dateTime={message.createdAt}>
                        {format.dateTime(new Date(message.createdAt), {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </time>
                    </div>
                    <div className="message-bubble bg-muted [border:1px_solid_var(--border)] rounded-[0_11px_11px] p-[11px_13px] text-foreground text-[12px] leading-[1.8] border-border [&_p]:whitespace-pre-wrap [&_p]:[overflow-wrap:anywhere] [&_blockquote]:m-[0_0_9px] [&_blockquote]:p-[5px_9px] [&_blockquote]:[border-left:2px_solid_var(--border)] [&_blockquote]:text-[10px] [&_blockquote]:text-muted-foreground [&_blockquote]:[background:color-mix(in_oklab,_var(--card)_40%,_transparent)] [&_blockquote]:whitespace-pre-wrap [&_blockquote]:[overflow-wrap:anywhere] max-[480px]:text-[12px] max-[480px]:p-[10px_11px]">
                      {parent && (
                        <blockquote>{parent.text.slice(0, 160)}</blockquote>
                      )}
                      <p>{message.text}</p>
                    </div>
                    {presenter && (
                      <Button
                        className="message-ask flex items-center gap-1 text-[8px] text-muted-foreground bg-transparent p-[5px_0] max-[480px]:text-[8px] max-[480px]:p-[7px_0]"
                        onClick={() => mode(message)}
                        aria-label={t("askAboutMessage")}
                      >
                        <Sparkles size={12} />
                        {t("askNeuron")}
                      </Button>
                    )}
                  </div>
                </article>
              );
            })}
            {busy && (
              <div
                className="thinking flex items-center gap-[7px] text-[10px] text-muted-foreground p-[7px_0] [&_>_span]:tracking-[3px] [&_>_span]:animate-pulse"
                role="status"
              >
                <Sparkles size={16} />
                {t("thinking")}
                <span>•••</span>
              </div>
            )}
            {ai?.status === "failed" && (
              <div
                className="ai-error text-[11px] text-destructive [background:color-mix(in_oklab,_var(--primary)_4%,_var(--card))] rounded-[8px] p-3 leading-[1.7] m-[10px_0] [&_button]:inline-flex [&_button]:items-center [&_button]:gap-[5px] [&_button]:ml-[10px] [&_button]:text-destructive [&_button]:bg-transparent [&_button]:text-[10px]"
                role="alert"
              >
                {errors(
                  ai.error === "AI_INTERRUPTED"
                    ? "AI_INTERRUPTED"
                    : "AI_UNAVAILABLE",
                )}
                {presenter && (
                  <Button variant="ghost" size="sm" onClick={retryAi}>
                    <RotateCcw size={13} />
                    {t("tryAgain")}
                  </Button>
                )}
              </div>
            )}
            <div ref={end} />
          </div>
          <div className="composer-area p-[12px_20px_10px] [border-top:1px_solid_var(--border)] [background:color-mix(in_oklab,_var(--primary)_4%,_var(--card))] max-[760px]:p-[10px_12px]">
            {!connected && (
              <div
                className="connection-warning flex items-center gap-[6px] text-[10px] text-primary mb-[10px]"
                role="status"
              >
                <WifiOff size={14} />
                {t("reconnecting")}
              </div>
            )}
            {presenter && (
              <div className="composer-toolbar flex items-center gap-[10px] mb-[10px] [&_>_span]:text-[8px] [&_>_span]:text-muted-foreground max-[480px]:[&_>_span]:text-[7px]">
                <Button
                  className={
                    aiMode
                      ? "neuron-toggle flex items-center gap-[5px] rounded-[6px] p-[6px_8px] text-[9px] [background:color-mix(in_oklab,_var(--primary)_4%,_var(--card))] text-muted-foreground [border:1px_solid_var(--border)] [&.enabled]:[background:color-mix(in_oklab,_var(--primary)_6%,_var(--card))] [&.enabled]:text-primary [&.enabled]:border-border enabled"
                      : "neuron-toggle flex items-center gap-[5px] rounded-[6px] p-[6px_8px] text-[9px] [background:color-mix(in_oklab,_var(--primary)_4%,_var(--card))] text-muted-foreground [border:1px_solid_var(--border)] [&.enabled]:[background:color-mix(in_oklab,_var(--primary)_6%,_var(--card))] [&.enabled]:text-primary [&.enabled]:border-border"
                  }
                  onClick={() =>
                    aiMode ? dispatch(actions.mode({ enabled: false })) : mode()
                  }
                  aria-pressed={aiMode}
                >
                  <Sparkles size={15} />
                  {t("askNeuron")}
                </Button>
                <span>{t("onlyHost")}</span>
              </div>
            )}
            {aiMode && (
              <div className="context-chip flex items-center gap-[7px] text-muted-foreground [background:color-mix(in_oklab,_var(--primary)_4%,_var(--card))] [border:1px_solid_var(--border)] rounded-[7px] p-2 mb-2 text-[9px] [&_>_span]:flex-1 [&_>_span]:min-w-0 [&_strong]:font-medium [&_small]:block [&_small]:overflow-hidden [&_small]:[text-overflow:ellipsis] [&_small]:whitespace-nowrap [&_small]:mt-[3px] [&_small]:text-muted-foreground">
                <Sparkles size={15} />
                <span>
                  <strong>
                    {t(target ? "selectedMessage" : "recentConversation")}
                  </strong>
                  {target && <small>{target.text.slice(0, 100)}</small>}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="icon-button inline-flex items-center justify-center bg-transparent text-muted-foreground p-[6px] rounded-[6px] [&:hover]:[background:color-mix(in_oklab,_var(--primary)_5%,_var(--card))]"
                  onClick={() => dispatch(actions.mode({ enabled: false }))}
                  aria-label={t("cancelNeuron")}
                >
                  <X size={15} />
                </Button>
              </div>
            )}
            <form
              className={`composer flex items-center gap-2 [border:1px_solid_var(--border)] [background:color-mix(in_oklab,_var(--primary)_4%,_var(--card))] rounded-[11px] p-2 [&:focus-within]:border-ring [&:focus-within]:[box-shadow:0_0_0_2px_color-mix(in_oklab,_var(--ring)_20%,_transparent)] ${aiMode ? "ai-composer [background:color-mix(in_oklab,_var(--primary)_4%,_var(--card))] border-border" : ""}`}
              onSubmit={send}
            >
              {aiMode && (
                <span
                  className="composer-neuron text-primary mt-2 [align-self:flex-start] [&.neuron-mark]:mt-[3px] neuron-mark inline-block w-[30px] h-[30px] shrink-0 rounded-full [background-image:url(/pairup-reference.png)] [background-size:90px_90px] [background-position:-11px_-4px] [mix-blend-mode:multiply] dark:[mix-blend-mode:normal]"
                  role="img"
                  aria-label={t("neuron")}
                />
              )}
              <Input
                ref={input}
                className="chat-message-input flex-1 min-w-0 border-0 bg-transparent! shadow-none p-[8px_5px] text-foreground h-[35px] text-[14px] [&:focus-visible]:border-0 [&:focus-visible]:shadow-none [&:focus-visible]:[outline:none] [&::placeholder]:text-muted-foreground max-[760px]:text-[16px]"
                aria-label={t(aiMode ? "askPlaceholder" : "messagePlaceholder")}
                placeholder={t(
                  aiMode ? "askPlaceholder" : "messagePlaceholder",
                )}
                value={aiMode ? aiDraft : draft}
                maxLength={aiMode ? 2000 : 1000}
                onChange={(e) =>
                  dispatch(
                    aiMode
                      ? actions.aiDraft(e.target.value)
                      : actions.draft(e.target.value),
                  )
                }
                onKeyDown={(e) => {
                  if (
                    e.key === "Enter" &&
                    !e.shiftKey &&
                    !e.nativeEvent.isComposing
                  ) {
                    e.preventDefault();
                    void send();
                  }
                }}
              />
              <Button
                type="submit"
                className="send-button w-[34px] h-[34px] bg-primary text-primary-foreground rounded-[8px] flex items-center justify-center shrink-0"
                aria-label={t("send")}
                disabled={
                  !connected ||
                  sending ||
                  asking ||
                  !(aiMode ? aiDraft : draft).trim() ||
                  (aiMode && busy)
                }
              >
                <ArrowUp size={20} />
              </Button>
            </form>
            {error && (
              <p
                className="error-text text-[11px] text-destructive! mt-[10px]! leading-[1.6]"
                role="alert"
              >
                {errors.has(error) ? errors(error) : errors("SERVER_ERROR")}
              </p>
            )}
            <p className="composer-hint text-[8px] text-muted-foreground text-center mt-2 max-[480px]:text-[7px]">
              {t("composerHint")}
            </p>
          </div>
        </section>
        <aside className="chat-info [&_.neuron-card_h3]:text-[19px] [&_.neuron-card_li]:gap-3 [&_.neuron-card_li]:text-[9px] [&_.neuron-card_li_>_span]:text-muted-foreground max-[1000px]:hidden">
          <Card className="block gap-0 ring-0 shadow-none neuron-card [background:linear-gradient(_130deg,_color-mix(in_oklab,_var(--primary)_5%,_var(--card)),_color-mix(in_oklab,_var(--primary)_4%,_var(--card))_)] [border:1px_solid_var(--border)] rounded-[15px] p-[22px] h-[fit-content] [&_h3]:text-[17px] [&_h3]:leading-[1.5] [&_h3]:tracking-[-0.5px] [&_h3]:font-semibold [&_>_p]:text-[10px] [&_>_p]:text-muted-foreground [&_>_p]:leading-[1.9] [&_>_p]:mt-[10px] [&_ul]:[list-style:none] [&_ul]:p-0 [&_ul]:m-[18px_0] [&_ul]:grid [&_ul]:gap-[10px] [&_li]:flex [&_li]:gap-2 [&_li]:items-center [&_li]:text-muted-foreground [&_li]:text-[10px] [&_li_svg]:text-muted-foreground [&_>_a]:flex [&_>_a]:justify-between [&_>_a]:items-center [&_>_a]:text-[10px] [&_>_a]:font-semibold [&_>_a]:text-sidebar-primary [&_>_a]:[border-top:1px_solid_var(--border)] [&_>_a]:mt-[15px] [&_>_a]:pt-4 max-[1200px]:p-[18px]">
            <div className="small-neuron h-[41px] w-[41px] rounded-[13px] bg-muted text-sidebar-primary inline-flex items-center justify-center mb-[13px]">
              <Sparkles size={23} />
            </div>
            <h3>{t("neuronInChat")}</h3>
            <p>{t("neuronInChatText")}</p>
            <ul>
              <li>
                01 <span>{t("translate")}</span>
              </li>
              <li>
                02 <span>{t("summarize")}</span>
              </li>
              <li>
                03 <span>{t("explain")}</span>
              </li>
            </ul>
          </Card>
          <div className="chat-details p-[24px_5px] [&_h3]:text-[11px] [&_h3]:flex [&_h3]:items-center [&_h3]:gap-[7px] [&_h3]:text-muted-foreground [&_p]:text-[10px] [&_p]:leading-[1.9] [&_p]:text-muted-foreground [&_p]:m-[13px_0]">
            <h3>
              <Users size={17} />
              {t("aboutRoom")}
            </h3>
            <Badge
              variant="secondary"
              className="subject-tag inline-flex items-center gap-[5px] text-[8px] bg-muted text-sidebar-primary p-[5px_8px] rounded-[5px]"
            >
              {session.name}
            </Badge>
          </div>
        </aside>
      </div>
      <AlertDialog open={confirmReset} onOpenChange={setConfirmReset}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("clearChat")}</AlertDialogTitle>
            <AlertDialogDescription>{t("clearConfirm")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={clear}>
              {t("clearChat")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
