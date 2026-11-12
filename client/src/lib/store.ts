import { configureStore, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { Listing, CreateListingInput } from "./local-data";

export type Session = { id: number; name: string; role: "guest" | "presenter" };
export type Message = {
  generation?: number;
  id: string;
  seq: number;
  author: string;
  sessionId: number | null;
  text: string;
  kind: string;
  targetMessageId: string | null;
  createdAt: string;
};
export type AiStatus = {
  generation?: number;
  id: string;
  status: string;
  error?: string | null;
} | null;
export type Snapshot = {
  messages: Message[];
  generation: number;
  hasMore: boolean;
  ai: AiStatus;
};
export const api = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({ baseUrl: "/api", credentials: "include" }),
  tagTypes: ["Listings"],
  endpoints: (builder) => ({
    listings: builder.query<Listing[], number | void>({
      query: (sessionId) => (sessionId ? "/listings?mine=true" : "/listings"),
      providesTags: ["Listings"],
    }),
    createListing: builder.mutation<Listing, CreateListingInput>({
      query: (body) => ({ url: "/listings", method: "POST", body }),
      invalidatesTags: ["Listings"],
    }),
    me: builder.query<Session | null, void>({ query: () => "/me" }),
    login: builder.mutation<Session, { password?: string }>({
      query: (data) => ({
        url: data.password !== undefined ? "/auth/presenter" : "/auth/demo",
        method: "POST",
        body: data,
      }),
    }),
    snapshot: builder.query<Snapshot, { after: number; syncId: string }>({
      query: ({ after }) => `/rooms/demo/messages?after=${after}`,
      keepUnusedDataFor: 0,
    }),
    ask: builder.mutation<
      NonNullable<AiStatus>,
      {
        clientRequestId: string;
        prompt: string;
        locale: string;
        targetMessageId?: string;
      }
    >({
      query: (body) => ({
        url: "/rooms/demo/ai/requests",
        method: "POST",
        body,
      }),
    }),
    reset: builder.mutation<{ ok: boolean }, void>({
      query: () => ({ url: "/rooms/demo/reset", method: "POST" }),
    }),
  }),
});
const initialState: {
  session: Session | null;
  messages: Message[];
  generation: number;
  connected: boolean;
  ai: AiStatus;
  draft: string;
  aiDraft: string;
  aiMode: boolean;
  target: Message | null;
} = {
  session: null,
  messages: [],
  generation: -1,
  connected: false,
  ai: null,
  draft: "",
  aiDraft: "",
  aiMode: false,
  target: null,
};
const slice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    session(state, action: PayloadAction<Session | null>) {
      state.session = action.payload;
    },
    connected(state, action: PayloadAction<boolean>) {
      state.connected = action.payload;
    },
    merge(state, action: PayloadAction<Message[]>) {
      const byId = new Map(state.messages.map((m) => [m.id, m]));
      for (const m of action.payload) {
        if (m.generation !== undefined && m.generation !== state.generation)
          continue;
        byId.set(m.id, m);
      }
      state.messages = [...byId.values()].sort((a, b) => a.seq - b.seq);
    },
    generation(state, action: PayloadAction<number>) {
      if (action.payload < state.generation) return;
      if (state.generation !== action.payload) {
        state.messages = [];
        state.target = null;
        state.ai = null;
        state.generation = action.payload;
      }
    },
    ai(state, action: PayloadAction<AiStatus>) {
      const incoming = action.payload;
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
export const createStore = () =>
  configureStore({
    reducer: { chat: slice.reducer, [api.reducerPath]: api.reducer },
    middleware: (getDefault) => getDefault().concat(api.middleware),
  });
export type Store = ReturnType<typeof createStore>;
export type RootState = ReturnType<Store["getState"]>;
export type Dispatch = Store["dispatch"];
export const {
  useMeQuery,
  useLoginMutation,
  useAskMutation,
  useResetMutation,
  useListingsQuery,
  useCreateListingMutation,
} = api;
