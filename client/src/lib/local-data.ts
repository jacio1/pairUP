export type ListingDraft = {
  title: string;
  subject: string;
  level: string;
  goal: string;
  format: string;
  schedule: string;
  location: string;
  description: string;
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
};
export const listingSubjects = [
  "math",
  "physics",
  "chemistry",
  "biology",
  "computerScience",
  "english",
  "russian",
  "history",
  "socialStudies",
  "other",
] as const;
export const listingLevels = [
  "beginner",
  "intermediate",
  "advanced",
  "olympiad",
  "examPreparation",
] as const;
export type Listing = ListingDraft & {
  id: string;
  roomId: string;
  authorName: string;
  createdAt: string;
};
export type CreateListingInput = ListingDraft & {
  id: string;
  authorName: string;
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
