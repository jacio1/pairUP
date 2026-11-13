import { useBrowserStorage } from "@/lib/browser-storage";
import { useAppSelector } from "@/lib/hooks";
import { emptyProfile, type StudyProfile } from "@/lib/local-data";
import { useListingsQuery } from "@/lib/store";
import { useState } from "react";
export function useProfileForm() {
  const [profile, saveProfile] = useBrowserStorage<StudyProfile>(
    "pairup.study-profile",
    emptyProfile,
  );
  const [favorite] = useBrowserStorage("pairup.favorite.demo-listing", false);
  const [editing, setEditing] = useState(false);
  const [profileStatus, setProfileStatus] = useState("");
  const session = useAppSelector((s) => s.chat.session);
  const { data: myListings } = useListingsQuery(session?.id, {
    skip: !session,
  });
  return {
    profile,
    saveProfile,
    favorite,
    editing,
    setEditing,
    profileStatus,
    setProfileStatus,
    session,
    myListings,
  };
}
export type ProfileForm = ReturnType<typeof useProfileForm>;
