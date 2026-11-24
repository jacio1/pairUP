import { sendChatMessage } from "@/lib/chat-transport";
import { errorCode } from "@/lib/errors";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { actions } from "@/lib/chat-state";
import {
  useAskMutation,
  useDeleteMessageMutation,
  useListingsQuery,
  useResetMutation,
} from "@/lib/api";
import { type Message } from "@/lib/chat-types";
import { useLocale } from "next-intl";
import { useRef, useState, type SubmitEvent } from "react";
export function useChatActions(roomId: string) {
  const { data: listings } = useListingsQuery();
  const listing = listings?.find((item) => item.roomId === roomId);
  const locale = useLocale();
  const {
    session,
    messages,
    connected,
    draft,
    aiDraft,
    aiMode,
    target,
    ai,
    replyTo,
  } = useAppSelector((s) => s.chat);
  const dispatch = useAppDispatch();
  const [ask, { isLoading: asking }] = useAskMutation();
  const [reset] = useResetMutation();
  const [deleteMessage] = useDeleteMessageMutation();
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [confirmReset, setConfirmReset] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const pendingSend = useRef<{
    text: string;
    id: string;
    target?: string;
  } | null>(null);
  const pendingAsk = useRef<{
    key: string;
    id: string;
  } | null>(null);
  const askInFlight = useRef(false);
  const busy = ai?.status === "running" || ai?.status === "pending";
  const presenter = session?.role === "presenter";
  const canAskNeuron = !!session;
  function mode(message?: Message) {
    dispatch(actions.mode({ enabled: true, target: message }));
    requestAnimationFrame(() => input.current?.focus());
  }
  function retryAi() {
    const request = messages
      .filter((message) => message.kind === "ai-request")
      .at(-1);
    if (request) dispatch(actions.aiDraft(request.text));
    mode(messages.find((message) => message.id === request?.targetMessageId));
  }
  function reply(message: Message) {
    dispatch(actions.mode({ enabled: false }));
    dispatch(actions.replyTo(message));
    requestAnimationFrame(() => input.current?.focus());
  }
  async function remove(message: Message) {
    try {
      dispatch(
        actions.merge([
          await deleteMessage({ roomId, id: message.id }).unwrap(),
        ]),
      );
      return null;
    } catch (e) {
      return errorCode(e);
    }
  }
  async function askNeuron(
    text: string,
    context: { targetMessageId?: string; tool?: "notes" | "tasks" | "pomodoro"; noteId?: string } = {},
  ) {
    if (!canAskNeuron || !connected || busy || askInFlight.current) return;
    const key = JSON.stringify([text, locale, context]);
    const previous = pendingAsk.current;
    const request = previous?.key === key ? previous : { key, id: crypto.randomUUID() };
    pendingAsk.current = request;
    askInFlight.current = true;
    try {
      const job = await ask({
        ...context,
        roomId,
        clientRequestId: request.id,
        prompt: text,
        locale,
      }).unwrap();
      pendingAsk.current = null;
      dispatch(actions.ai(job));
      return job;
    } finally {
      askInFlight.current = false;
    }
  }
  async function send(e?: SubmitEvent<HTMLFormElement>) {
    e?.preventDefault();
    const text = (aiMode ? aiDraft : draft).trim();
    if (!text || sending || asking || !connected || (aiMode && busy)) return;
    setError("");
    if (aiMode) {
      try {
        if (!(await askNeuron(text, { targetMessageId: target?.id }))) return;
        dispatch(actions.clearSentDraft({ ai: true, text }));
        dispatch(actions.mode({ enabled: false }));
      } catch (e) {
        setError(errorCode(e));
      }
      return;
    }
    const request =
      pendingSend.current?.text === text &&
      pendingSend.current.target === replyTo?.id
        ? pendingSend.current
        : { text, target: replyTo?.id, id: crypto.randomUUID() };
    pendingSend.current = request;
    setSending(true);
    sendChatMessage(
      { text, clientRequestId: request.id, targetMessageId: request.target },
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
        dispatch(actions.clearReply(request.target));
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
    replyTo,
    reply,
    remove,
    ai,
    asking,
    sending,
    error,
    confirmReset,
    setConfirmReset,
    input,
    busy,
    presenter,
    canAskNeuron,
    askNeuron,
    mode,
    retryAi,
    send,
    clear,
  };
}
export type ChatActions = ReturnType<typeof useChatActions>;
