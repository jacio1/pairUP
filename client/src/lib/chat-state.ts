import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { Session, Message, AiStatus } from "./chat-types";

const initialState: {
  session: Session | null;
  roomId: string | null;
  messages: Message[];
  references: Record<string, { id: string; text: string }>;
  historyReady: boolean;
  hasOlder: boolean;
  generation: number;
  connected: boolean;
  ai: AiStatus;
  draft: string;
  aiDraft: string;
  aiMode: boolean;
  target: Message | null;
  replyTo: Message | null;
  deletedIds: Record<string, true>;
} = {
  session: null,
  roomId: null,
  messages: [],
  references: {},
  historyReady: false,
  hasOlder: false,
  generation: -1,
  connected: false,
  ai: null,
  draft: "",
  aiDraft: "",
  aiMode: false,
  target: null,
  replyTo: null,
  deletedIds: {},
};

function markDeleted(state: typeof initialState, ids: string[]) {
  for (const id of ids) {
    state.deletedIds[id] = true;
    delete state.references[id];
    if (state.replyTo?.id === id) state.replyTo = null;
    if (state.target?.id === id) state.target = null;
  }
}
const slice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    session(state, action: PayloadAction<Session | null>) {
      state.session = action.payload;
    },
    room(state, action: PayloadAction<string | null | undefined>) {
      state.roomId = action.payload || null;
      state.messages = [];
      state.references = {};
      state.historyReady = false;
      state.hasOlder = false;
      state.generation = -1;
      state.ai = null;
      state.target = null;
      state.replyTo = null;
      state.deletedIds = {};
      state.draft = "";
      state.aiDraft = "";
      state.aiMode = false;
    },
    references(
      state,
      action: PayloadAction<{
        roomId: string;
        generation: number;
        items: { id: string; text: string }[];
      }>,
    ) {
      if (
        state.roomId !== action.payload.roomId ||
        state.generation !== action.payload.generation
      )
        return;
      for (const item of action.payload.items)
        if (!state.deletedIds[item.id]) state.references[item.id] = item;
    },
    history(
      state,
      action: PayloadAction<{
        roomId: string;
        generation: number;
        hasOlder: boolean;
      }>,
    ) {
      if (
        state.roomId !== action.payload.roomId ||
        state.generation !== action.payload.generation
      )
        return;
      state.historyReady = true;
      state.hasOlder = action.payload.hasOlder;
    },
    connected(state, action: PayloadAction<boolean>) {
      state.connected = action.payload;
    },
    merge(state, action: PayloadAction<Message[]>) {
      const byId = new Map(state.messages.map((m) => [m.id, m]));
      for (const m of action.payload) {
        if (m.roomId && m.roomId !== state.roomId) continue;
        if (m.generation !== undefined && m.generation !== state.generation)
          continue;
        if (m.kind === "deleted") markDeleted(state, [m.id]);
        byId.set(m.id, m);
      }
      state.messages = [...byId.values()]
        .filter((m) => !state.deletedIds[m.id])
        .sort((a, b) => a.seq - b.seq);
    },
    deleted(
      state,
      action: PayloadAction<{
        roomId: string;
        generation: number;
        ids: string[];
      }>,
    ) {
      if (
        state.roomId !== action.payload.roomId ||
        state.generation !== action.payload.generation
      )
        return;
      markDeleted(state, action.payload.ids);
      state.messages = state.messages.filter((m) => !state.deletedIds[m.id]);
    },
    replyTo(state, action: PayloadAction<Message | null>) {
      state.replyTo =
        action.payload && !state.deletedIds[action.payload.id]
          ? action.payload
          : null;
    },
    clearReply(state, action: PayloadAction<string | undefined>) {
      if (state.replyTo?.id === action.payload) state.replyTo = null;
    },
    generation(state, action: PayloadAction<number>) {
      if (action.payload < state.generation) return;
      if (state.generation !== action.payload) {
        state.messages = [];
        state.references = {};
        state.historyReady = false;
        state.hasOlder = false;
        state.target = null;
        state.replyTo = null;
        state.deletedIds = {};
        state.ai = null;
        state.generation = action.payload;
      }
    },
    ai(state, action: PayloadAction<AiStatus>) {
      const incoming = action.payload;
      if (incoming?.roomId && incoming.roomId !== state.roomId) return;
      if (
        incoming?.generation !== undefined &&
        incoming.generation !== state.generation
      )
        return;
      if (
        incoming?.id === state.ai?.id &&
        ["completed", "failed", "cancelled"].includes(state.ai?.status || "") &&
        ["pending", "running"].includes(incoming?.status || "")
      )
        return;
      state.ai = action.payload;
    },
    draft(state, action: PayloadAction<string>) {
      state.draft = action.payload;
    },
    aiDraft(state, action: PayloadAction<string>) {
      state.aiDraft = action.payload;
    },
    clearSentDraft(
      state,
      action: PayloadAction<{ ai: boolean; text: string }>,
    ) {
      const key = action.payload.ai ? "aiDraft" : "draft";
      if (state[key].trim() === action.payload.text) state[key] = "";
    },
    mode(state, action: PayloadAction<{ enabled: boolean; target?: Message }>) {
      state.aiMode = action.payload.enabled;
      state.target = action.payload.target || null;
    },
  },
});
export const actions = slice.actions;

export const chatReducer = slice.reducer;
