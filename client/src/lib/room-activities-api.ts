import { api } from "./store";
import { subscribeBoardSnapshots } from "./board-events";
export type BoardElement = {
  strokeId?: string;
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
  .enhanceEndpoints({ addTagTypes: ["StudyTools", "RoomBoard"] })
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
        providesTags: (_, __, id) => [{ type: "RoomBoard", id }],
        keepUnusedDataFor: 30,
        merge(current, incoming) {
          if (incoming.version >= current.version) return incoming;
        },
        async onCacheEntryAdded(
          roomId,
          { cacheDataLoaded, cacheEntryRemoved, updateCachedData },
        ) {
          let latest: Board | undefined;
          const apply = (incoming: Board) =>
            updateCachedData((current) => {
              if (incoming.version >= current.version) return incoming;
            });
          const unsubscribe = subscribeBoardSnapshots((incoming) => {
            if (incoming.roomId !== roomId) return;
            if (!latest || incoming.version >= latest.version) {
              latest = incoming;
              apply(incoming);
            }
          });
          try {
            await cacheDataLoaded;
            if (latest) apply(latest);
            await cacheEntryRemoved;
          } catch {
          } finally {
            unsubscribe();
          }
        },
      }),
      changeBoard: b.mutation<Board, { roomId: string } & BoardChange>({
        query: ({ roomId, ...body }) => ({
          url: `${path(roomId)}/board`,
          method: "POST",
          body,
        }),
        async onQueryStarted(
          { roomId },
          { dispatch, queryFulfilled },
        ): Promise<void> {
          try {
            const { data } = await queryFulfilled;
            dispatch(
              activitiesApi.util.updateQueryData(
                "roomBoard",
                roomId,
                (current) => {
                  if (data.version >= current.version) return data;
                },
              ),
            );
          } catch {}
        },
      }),
    }),
  });
export const {
  useRoomTimerQuery,
  useChangeTimerMutation,
  useRoomBoardQuery,
  useChangeBoardMutation,
} = activitiesApi;
