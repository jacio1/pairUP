import { api } from "./store";
export type BoardElement = {
  id: string;
  kind: "pencil" | "line" | "square" | "circle" | "text";
  color: string;
  width: number;
  points: number[][];
  text?: string;
};
export type Board = {
  roomId: string;
  generation: number;
  version: number;
  elements: BoardElement[];
};
export type Timer = {
  roomId: string;
  version: number;
  mode: "focus" | "break" | "longBreak";
  focusSeconds: number;
  breakSeconds: number;
  longBreakSeconds: number;
  remainingMs: number;
  endsAt: string | null;
  completed: number;
  serverNow: number;
  receivedAt: number;
};
export type TimerChange = {
  action: "start" | "pause" | "reset" | "next" | "configure" | "mode";
  mode?: Timer["mode"];
  focusSeconds?: number;
  breakSeconds?: number;
  longBreakSeconds?: number;
};
type BoardChange = {
  action: "add" | "remove" | "clear";
  generation: number;
  version?: number;
  element?: BoardElement;
  id?: string;
};
const path = (roomId: string) => `/rooms/${encodeURIComponent(roomId)}/tools`;
const tags = (roomId: string) => [{ type: "StudyTools" as const, id: roomId }];
const clock = (timer: Timer) => ({ ...timer, receivedAt: performance.now() });
export const activitiesApi = api
  .enhanceEndpoints({ addTagTypes: ["StudyTools"] })
  .injectEndpoints({
    endpoints: (b) => ({
      roomTimer: b.query<Timer, string>({
        query: (id) => `${path(id)}/timer`,
        transformResponse: clock,
        providesTags: (_, __, id) => tags(id),
        keepUnusedDataFor: 0,
      }),
      changeTimer: b.mutation<
        Timer,
        { roomId: string; version: number } & TimerChange
      >({
        query: ({ roomId, ...body }) => ({
          url: `${path(roomId)}/timer`,
          method: "POST",
          body,
        }),
        transformResponse: clock,
        invalidatesTags: (_, __, { roomId }) => tags(roomId),
      }),
      roomBoard: b.query<Board, string>({
        query: (id) => `${path(id)}/board`,
        providesTags: (_, __, id) => tags(id),
        keepUnusedDataFor: 30,
      }),
      changeBoard: b.mutation<Board, { roomId: string } & BoardChange>({
        query: ({ roomId, ...body }) => ({
          url: `${path(roomId)}/board`,
          method: "POST",
          body,
        }),
        invalidatesTags: (_, __, { roomId }) => tags(roomId),
      }),
    }),
  });
export const {
  useRoomTimerQuery,
  useChangeTimerMutation,
  useRoomBoardQuery,
  useChangeBoardMutation,
} = activitiesApi;
