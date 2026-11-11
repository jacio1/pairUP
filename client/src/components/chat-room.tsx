"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
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
  async function send(e?: FormEvent) {
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
      <main className="page">
        <section className="chat-gate">
          <NeuronArt small />
          <span className="hero-badge">
            <MessageCircle size={15} />
            {t("liveDemo")}
          </span>
          <h1>{t("joinChatTitle")}</h1>
          <p>{t("joinChatText")}</p>
          <JoinButton />
        </section>
      </main>
    );
  return (
    <main className="page chat-page">
      <Link className="back-link" href="/messages">
        <ChevronLeft size={16} />
        {t("backDiscover")}
      </Link>
      <div className="chat-layout">
        <section className="chat-panel">
          <header className="chat-header">
            <span className="room-icon">
              <GraduationCap size={25} />
            </span>
            <div>
              <h1>{t("chatTitle")}</h1>
              <p>
                <span className={connected ? "online-dot" : "offline-dot"} />
                <span role="status">
                  {t(connected ? "connected" : "reconnecting")}
                </span>
                <span>·</span>
                {t("openGroup")}
              </p>
            </div>
            {presenter && (
              <button
                className="icon-button clear-button"
                aria-label={t("clearChat")}
                title={t("clearChat")}
                onClick={() => setConfirmReset(true)}
              >
                <Trash2 size={17} />
              </button>
            )}
          </header>
          <div
            className="chat-messages"
            role="log"
            aria-label={t("messages")}
            aria-live="polite"
          >
            <div className="room-welcome">
              <span className="small-neuron">
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
                  className={`message-row ${mine ? "mine" : ""} ${neuron ? "neuron-message" : ""}`}
                >
                  <span
                    className={`avatar message-avatar ${neuron ? "neuron-avatar" : ""}`}
                  >
                    {neuron ? (
                      <Sparkles size={17} />
                    ) : message.author.startsWith("TEST") ? (
                      "T"
                    ) : (
                      "P"
                    )}
                  </span>
                  <div className="message-body">
                    <div className="message-meta">
                      <strong>{neuron ? t("neuron") : message.author}</strong>
                      {message.kind === "ai-request" && (
                        <span className="request-tag">
                          <Sparkles size={11} />
                          {t("askedNeuron")}
                        </span>
                      )}
                      <time dateTime={message.createdAt}>
                        {format.dateTime(new Date(message.createdAt), {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </time>
                    </div>
                    <div className="message-bubble">
                      {parent && (
                        <blockquote>{parent.text.slice(0, 160)}</blockquote>
                      )}
                      <p>{message.text}</p>
                    </div>
                    {presenter && (
                      <button
                        className="message-ask"
                        onClick={() => mode(message)}
                        aria-label={t("askAboutMessage")}
                      >
                        <Sparkles size={12} />
                        {t("askNeuron")}
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
            {busy && (
              <div className="thinking" role="status">
                <Sparkles size={16} />
                {t("thinking")}
                <span>•••</span>
              </div>
            )}
            {ai?.status === "failed" && (
              <div className="ai-error" role="alert">
                {errors(
                  ai.error === "AI_INTERRUPTED"
                    ? "AI_INTERRUPTED"
                    : "AI_UNAVAILABLE",
                )}
                {presenter && (
                  <button onClick={retryAi}>
                    <RotateCcw size={13} />
                    {t("tryAgain")}
                  </button>
                )}
              </div>
            )}
            <div ref={end} />
          </div>
          <div className="composer-area">
            {!connected && (
              <div className="connection-warning" role="status">
                <WifiOff size={14} />
                {t("reconnecting")}
              </div>
            )}
            {presenter && (
              <div className="composer-toolbar">
                <button
                  className={aiMode ? "neuron-toggle enabled" : "neuron-toggle"}
                  onClick={() =>
                    aiMode ? dispatch(actions.mode({ enabled: false })) : mode()
                  }
                  aria-pressed={aiMode}
                >
                  <Sparkles size={15} />
                  {t("askNeuron")}
                </button>
                <span>{t("onlyHost")}</span>
              </div>
            )}
            {aiMode && (
              <div className="context-chip">
                <Sparkles size={15} />
                <span>
                  <strong>
                    {t(target ? "selectedMessage" : "recentConversation")}
                  </strong>
                  {target && <small>{target.text.slice(0, 100)}</small>}
                </span>
                <button
                  className="icon-button"
                  onClick={() => dispatch(actions.mode({ enabled: false }))}
                  aria-label={t("cancelNeuron")}
                >
                  <X size={15} />
                </button>
              </div>
            )}
            <form
              className={`composer ${aiMode ? "ai-composer" : ""}`}
              onSubmit={send}
            >
              {aiMode && (
                <span
                  className="composer-neuron neuron-mark"
                  role="img"
                  aria-label={t("neuron")}
                />
              )}
              <Input
                ref={input}
                className="chat-message-input"
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
              <button
                className="send-button"
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
              </button>
            </form>
            {error && (
              <p className="error-text" role="alert">
                {errors.has(error) ? errors(error) : errors("SERVER_ERROR")}
              </p>
            )}
            <p className="composer-hint">{t("composerHint")}</p>
          </div>
        </section>
        <aside className="chat-info">
          <div className="neuron-card">
            <div className="small-neuron">
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
          </div>
          <div className="chat-details">
            <h3>
              <Users size={17} />
              {t("aboutRoom")}
            </h3>
            <span className="subject-tag">{session.name}</span>
          </div>
        </aside>
      </div>
      {confirmReset && (
        <div className="modal-overlay">
          <section
            className="confirm-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="clear-title"
          >
            <h2 id="clear-title">{t("clearChat")}</h2>
            <p>{t("clearConfirm")}</p>
            <div>
              <button
                className="secondary-button"
                onClick={() => setConfirmReset(false)}
              >
                {t("cancel")}
              </button>
              <button className="danger-button" onClick={clear}>
                {t("clearChat")}
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
