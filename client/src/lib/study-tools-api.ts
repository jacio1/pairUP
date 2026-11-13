import { api } from "./store";

export type StudyNote = {
  id: string;
  title: string;
  version: number;
  createdAt: string;
  updatedAt: string;
};
export type NoteDocument = StudyNote & { roomId: string; state: string };
export type StudyTask = {
  id: string;
  roomId: string;
  title: string;
  completed: boolean;
  version: number;
  createdAt: string;
  updatedAt: string;
};
export type StudySnapshot = { notes: StudyNote[]; tasks: StudyTask[] };
type RoomItem = { roomId: string; id: string };
const path = (roomId: string) => `/rooms/${encodeURIComponent(roomId)}/tools`;
const tags = (roomId: string, id?: string) => [
  { type: "StudyTools" as const, id: roomId },
  ...(id ? [{ type: "StudyNote" as const, id }] : []),
];

export const studyApi = api
  .enhanceEndpoints({ addTagTypes: ["StudyTools", "StudyNote"] })
  .injectEndpoints({
    endpoints: (builder) => ({
      studyTools: builder.query<StudySnapshot, string>({
        query: (roomId) => path(roomId),
        providesTags: (_, __, roomId) => tags(roomId),
        keepUnusedDataFor: 30,
      }),
      studyNote: builder.query<NoteDocument, RoomItem>({
        query: ({ roomId, id }) =>
          `${path(roomId)}/notes/${encodeURIComponent(id)}`,
        providesTags: (_, __, { id }) => [{ type: "StudyNote", id }],
        keepUnusedDataFor: 0,
      }),
      createNote: builder.mutation<NoteDocument, RoomItem>({
        query: ({ roomId, id }) => ({
          url: `${path(roomId)}/notes`,
          method: "POST",
          body: { id },
        }),
        invalidatesTags: (_, __, { roomId }) => tags(roomId),
      }),
      saveNote: builder.mutation<NoteDocument, RoomItem & { state: string }>({
        query: ({ roomId, id, state }) => ({
          url: `${path(roomId)}/notes/${encodeURIComponent(id)}`,
          method: "POST",
          body: { state },
        }),
        invalidatesTags: (_, __, { roomId, id }) => tags(roomId, id),
      }),
      deleteNote: builder.mutation<
        { ok: boolean },
        RoomItem & { version: number }
      >({
        query: ({ roomId, id, version }) => ({
          url: `${path(roomId)}/notes/${encodeURIComponent(id)}/delete`,
          method: "POST",
          body: { version },
        }),
        invalidatesTags: (_, __, { roomId, id }) => tags(roomId, id),
      }),
      createTask: builder.mutation<StudyTask, RoomItem & { title: string }>({
        query: ({ roomId, id, title }) => ({
          url: `${path(roomId)}/tasks`,
          method: "POST",
          body: { id, title },
        }),
        invalidatesTags: (_, __, { roomId }) => tags(roomId),
      }),
      updateTask: builder.mutation<
        StudyTask,
        RoomItem & { version: number; title?: string; completed?: boolean }
      >({
        query: ({ roomId, id, ...body }) => ({
          url: `${path(roomId)}/tasks/${encodeURIComponent(id)}`,
          method: "POST",
          body,
        }),
        invalidatesTags: (_, __, { roomId }) => tags(roomId),
      }),
      deleteTask: builder.mutation<
        { ok: boolean },
        RoomItem & { version: number }
      >({
        query: ({ roomId, id, version }) => ({
          url: `${path(roomId)}/tasks/${encodeURIComponent(id)}/delete`,
          method: "POST",
          body: { version },
        }),
        invalidatesTags: (_, __, { roomId }) => tags(roomId),
      }),
    }),
  });
export const {
  useStudyToolsQuery,
  useStudyNoteQuery,
  useCreateNoteMutation,
  useSaveNoteMutation,
  useDeleteNoteMutation,
  useCreateTaskMutation,
  useUpdateTaskMutation,
  useDeleteTaskMutation,
} = studyApi;

export function studyError(error: unknown) {
  return (error as { data?: { code?: string } })?.data?.code || "SERVER_ERROR";
}
