import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { CreateListingInput, Listing } from "./local-data";
import type { Proposal, Session, Snapshot, AiStatus, Message } from "./chat-types";

export const api = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({ baseUrl: "/api", credentials: "include" }),
  tagTypes: ["Listings", "Proposals", "Social", "SocialComments"],
  endpoints: (builder) => ({
    proposals: builder.query<Proposal[], void>({
      query: () => "/proposals",
      providesTags: ["Proposals"],
    }),
    propose: builder.mutation<unknown, string>({
      query: (id) => ({
        url: `/listings/${encodeURIComponent(id)}/proposals`,
        method: "POST",
      }),
      invalidatesTags: ["Proposals"],
    }),
    respond: builder.mutation<unknown, { id: string; accept: boolean }>({
      query: ({ id, accept }) => ({
        url: `/proposals/${encodeURIComponent(id)}/respond`,
        method: "POST",
        body: { accept },
      }),
      invalidatesTags: ["Proposals"],
    }),
    logout: builder.mutation<unknown, void>({
      query: () => ({ url: "/auth/logout", method: "POST" }),
    }),
    listings: builder.query<Listing[], number | void>({
      query: (sessionId) => (sessionId ? "/listings?mine=true" : "/listings"),
      providesTags: ["Listings"],
    }),
    createListing: builder.mutation<Listing, CreateListingInput | FormData>({
      query: (body) => ({ url: "/listings", method: "POST", body }),
      invalidatesTags: ["Listings", "Social"],
    }),
    me: builder.query<Session | null, void>({ query: () => "/me" }),
    login: builder.mutation<Session, { password?: string }>({
      query: (data) => ({
        url: data.password !== undefined ? "/auth/presenter" : "/auth/demo",
        method: "POST",
        body: data,
      }),
    }),
    snapshot: builder.query<
      Snapshot,
      {
        after?: number;
        before?: number;
        generation?: number;
        syncId: string;
        roomId: string;
      }
    >({
      query: ({ after, before, generation, roomId }) =>
        `/rooms/${encodeURIComponent(roomId)}/messages?${new URLSearchParams(
          Object.entries({ after, before, generation })
            .filter(([, v]) => v !== undefined)
            .map(([k, v]) => [k, String(v)]),
        )}`,
      keepUnusedDataFor: 0,
    }),
    ask: builder.mutation<
      NonNullable<AiStatus>,
      {
        roomId: string;
        clientRequestId: string;
        prompt: string;
        locale: string;
        targetMessageId?: string;
        tool?: "notes" | "tasks" | "pomodoro";
        noteId?: string;
      }
    >({
      query: ({ roomId, ...body }) => ({
        url: `/rooms/${encodeURIComponent(roomId)}/ai/requests`,
        method: "POST",
        body,
      }),
    }),
    deleteMessage: builder.mutation<Message, { roomId: string; id: string }>({
      query: ({ roomId, id }) => ({
        url: `/rooms/${encodeURIComponent(roomId)}/messages/${encodeURIComponent(id)}`,
        method: "DELETE",
      }),
    }),
    reset: builder.mutation<{ ok: boolean }, string>({
      query: (roomId) => ({
        url: `/rooms/${encodeURIComponent(roomId)}/reset`,
        method: "POST",
      }),
    }),
  }),
});

export const {
  useProposalsQuery,
  useProposeMutation,
  useRespondMutation,
  useLogoutMutation,
  useMeQuery,
  useLoginMutation,
  useAskMutation,
  useResetMutation,
  useDeleteMessageMutation,
  useListingsQuery,
  useCreateListingMutation,
} = api;
