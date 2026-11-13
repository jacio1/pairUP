import { api } from "./store";
import type { Listing, StudyProfile } from "./local-data";
export type PublicProfile = StudyProfile & {
  id: number;
  version: number;
  createdAt: string;
  updatedAt: string;
  listings: Listing[];
  _count: { listings: number };
};
export const profilesApi = api
  .enhanceEndpoints({ addTagTypes: ["MyProfile", "PublicProfile"] })
  .injectEndpoints({
    endpoints: (builder) => ({
      myProfile: builder.query<PublicProfile, void>({
        query: () => "/me/profile",
        providesTags: ["MyProfile"],
        keepUnusedDataFor: 0,
      }),
      publicProfile: builder.query<PublicProfile, string>({
        query: (id) => `/profiles/${encodeURIComponent(id)}`,
        providesTags: (_, __, id) => [{ type: "PublicProfile", id }],
        keepUnusedDataFor: 30,
      }),
      saveProfile: builder.mutation<
        PublicProfile,
        StudyProfile & { version: number }
      >({
        query: (body) => ({ url: "/me/profile", method: "POST", body }),
        invalidatesTags: (result) =>
          result ? ["MyProfile", "PublicProfile", "Listings"] : [],
      }),
    }),
  });
export const {
  useMyProfileQuery,
  usePublicProfileQuery,
  useSaveProfileMutation,
} = profilesApi;
