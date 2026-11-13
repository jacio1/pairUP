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
  publicId: number;
  ownerSessionId?: number | null;
  authorProfileId?: number | null;
  authorProfile?: { id: number; name: string; avatar: string } | null;
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

const cyrillic = "абвгдеёжзийклмнопрстуфхцчшщъыьэюя";
const latin = [
  "a",
  "b",
  "v",
  "g",
  "d",
  "e",
  "yo",
  "zh",
  "z",
  "i",
  "y",
  "k",
  "l",
  "m",
  "n",
  "o",
  "p",
  "r",
  "s",
  "t",
  "u",
  "f",
  "kh",
  "ts",
  "ch",
  "sh",
  "shch",
  "",
  "y",
  "",
  "e",
  "yu",
  "ya",
];
export function listingSlug(listing: Pick<Listing, "title" | "publicId">) {
  const title = [...listing.title.toLowerCase()]
    .map((char) => {
      const index = cyrillic.indexOf(char);
      return index < 0 ? char : latin[index];
    })
    .join("")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60)
    .replace(/-$/, "");
  return `${title || "listing"}-${listing.publicId}`;
}
export const listingHref = (listing: Pick<Listing, "title" | "publicId">) =>
  `/listings/${listingSlug(listing)}`;
