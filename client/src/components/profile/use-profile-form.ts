import { useBrowserStorage } from "@/lib/browser-storage";
import { useAppSelector } from "@/lib/hooks";
import { emptyProfile, type StudyProfile } from "@/lib/local-data";
import { useMyProfileQuery, useSaveProfileMutation } from "@/lib/profiles-api";
import { studyError } from "@/lib/study-tools-api";
import { useRef, useState } from "react";
export function useProfileForm() {
  const [legacy] = useBrowserStorage<StudyProfile>(
    "pairup.study-profile",
    emptyProfile,
  );
  const [editing, setEditing] = useState(false);
  const [profileStatus, setProfileStatus] = useState("");
  const session = useAppSelector((s) => s.chat.session);
  const {
    data: publicProfile,
    isLoading,
    error,
    refetch,
  } = useMyProfileQuery(undefined, {
    skip: !session,
  });
  const [save, { isLoading: saving }] = useSaveProfileMutation();
  const inFlight = useRef(false);
  const profile: StudyProfile = publicProfile
    ? {
        name: publicProfile.name,
        bio: publicProfile.bio,
        interests: publicProfile.interests,
        goal: publicProfile.goal,
        availability: publicProfile.availability,
        avatar: publicProfile.avatar,
      }
    : {
        ...emptyProfile,
        name: session?.name || "",
      };
  // Old browser-only values remain a visible draft until the user explicitly saves.
  const editorProfile =
    publicProfile?.version === 0 &&
    Object.entries(legacy).some(([key, value]) => key !== "avatar" && value)
      ? legacy
      : profile;
  async function saveProfile(value: StudyProfile, version: number) {
    if (!publicProfile || inFlight.current) return false;
    inFlight.current = true;
    try {
      await save({ ...value, version }).unwrap();
      setProfileStatus("profileSaved");
      return true;
    } catch (cause) {
      const code = studyError(cause);
      setProfileStatus(code);
      if (code === "PROFILE_CONFLICT") void refetch();
      return false;
    } finally {
      inFlight.current = false;
    }
  }
  return {
    profile,
    saveProfile,
    editorProfile,
    publicProfile,
    saving,
    isLoading,
    error,
    refetch,
    editing,
    setEditing,
    profileStatus,
    setProfileStatus,
    session,
  };
}
export type ProfileForm = ReturnType<typeof useProfileForm>;
