import { api } from "./api";
import type { Listing } from "./local-data";

export type SocialMedia = { id: string; name: string; kind: string };
type Author = { id: number; name: string };
export type SocialPost = {
  id: string;
  text: string;
  author: Author | null;
  createdAt: string;
  canEdit: boolean;
  media: SocialMedia[];
  listing:
    | (Pick<
        Listing,
        "id" | "publicId" | "title" | "description" | "authorName"
      > & {
        authorProfile: Author | null;
      })
    | null;
  reactions: { emoji: string; count: number; active: boolean }[];
  _count: { comments: number };
};
export type SocialComment = { id: string; text: string; author: Author };

function upload(text: string, files: File[], remove: string[] = []) {
  const body = new FormData();
  body.set("text", text);
  if (remove.length) body.set("remove", JSON.stringify(remove));
  for (const file of files) body.append("files", file);
  return body;
}

export const {
  useSocialFeedQuery,
  useListingSocialQuery,
  useSocialCommentsQuery,
  usePublishPostMutation,
  useEditPostMutation,
  useDeletePostMutation,
  useReactToPostMutation,
  useCommentOnPostMutation,
} = api.injectEndpoints({
  endpoints: (builder) => ({
    socialFeed: builder.query<SocialPost[], string>({
      query: (filter) => `/social/feed${filter ? `?${filter}` : ""}`,
      providesTags: ["Social"],
    }),
    listingSocial: builder.query<SocialPost, string>({
      query: (id) => `/social/listings/${encodeURIComponent(id)}`,
      providesTags: ["Social"],
    }),
    socialComments: builder.query<
      SocialComment[],
      { id: string; before?: string }
    >({
      query: ({ id, before }) =>
        `/social/${id}/comments${before ? `?before=${before}` : ""}`,
      providesTags: (_data, _error, { id }) => [{ type: "SocialComments", id }],
    }),
    publishPost: builder.mutation<unknown, { text: string; files: File[] }>({
      query: ({ text, files }) => ({
        url: "/social/feed",
        method: "POST",
        body: upload(text, files),
      }),
      invalidatesTags: (_data, error) => (error ? [] : ["Social"]),
    }),
    editPost: builder.mutation<
      unknown,
      { id: string; text: string; files: File[]; remove: string[] }
    >({
      query: ({ id, text, files, remove }) => ({
        url: `/social/${id}`,
        method: "PATCH",
        body: upload(text, files, remove),
      }),
      invalidatesTags: (_data, error) => (error ? [] : ["Social", "Listings"]),
    }),
    deletePost: builder.mutation<unknown, string>({
      query: (id) => ({ url: `/social/${id}`, method: "DELETE" }),
      invalidatesTags: (_data, error) => (error ? [] : ["Social"]),
    }),
    reactToPost: builder.mutation<
      unknown,
      { id: string; emoji: string; active: boolean }
    >({
      query: ({ id, ...body }) => ({
        url: `/social/${id}/reactions`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (_data, error) => (error ? [] : ["Social"]),
    }),
    commentOnPost: builder.mutation<unknown, { id: string; text: string }>({
      query: ({ id, text }) => ({
        url: `/social/${id}/comments`,
        method: "POST",
        body: { text },
      }),
      invalidatesTags: (_data, error, { id }) =>
        error ? [] : ["Social", { type: "SocialComments", id }],
    }),
  }),
});
