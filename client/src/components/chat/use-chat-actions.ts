import { sendChatMessage } from "@/lib/chat-transport";
import { errorCode } from "@/lib/errors";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import {
  actions,
  useAskMutation,
  useListingsQuery,
  useResetMutation,
  type Message,
} from "@/lib/store";
import { useLocale } from "next-intl";
import { useRef, useState, type SubmitEvent } from "react";
export function useChatActions(roomId: string) {
  const { data: listings } = useListingsQuery();
  const listing = listings?.find((item) => item.roomId === roomId);
  const locale = useLocale();
  const { session, messages, connected, draft, aiDraft, aiMode, target, ai } =
    useAppSelector((s) => s.chat);
  const dispatch = useAppDispatch();
  const [ask, { isLoading: asking }] = useAskMutation();
  const [reset] = useResetMutation();
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [confirmReset, setConfirmReset] = useState(false);
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
          roomId,
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
    sendChatMessage(
      { text, clientRequestId: request.id },
      (
        err: Error | null,
        response?: { ok: boolean; code?: string; message?: Message },
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
      await reset(roomId).unwrap();
      setConfirmReset(false);
      setError("");
    } catch (e) {
      setError(errorCode(e));
    }
  }
  return {
    listing,
    session,
    messages,
    connected,
    draft,
    aiDraft,
    aiMode,
    target,
    ai,
    asking,
    sending,
    error,
    confirmReset,
    setConfirmReset,
    input,
    busy,
    presenter,
    mode,
    retryAi,
    send,
    clear,
  };
}
export type ChatActions = ReturnType<typeof useChatActions>;
