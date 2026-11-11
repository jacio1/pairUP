export type ListingDraft = {
  title: string;
  subject: string;
  level: string;
  goal: string;
  format: string;
  schedule: string;
  location: string;
  description: string;
  savedAt: string;
};
export const emptyListing: ListingDraft = {
  title: "",
  subject: "",
  level: "",
  goal: "",
  format: "online",
  schedule: "",
  location: "",
  description: "",
  savedAt: "",
};
export type StudyProfile = {
  name: string;
  bio: string;
  interests: string;
  goal: string;
  availability: string;
  avatar: string;
};
export const emptyProfile: StudyProfile = {
  name: "",
  bio: "",
  interests: "",
  goal: "",
  availability: "",
  avatar: "violet",
};
