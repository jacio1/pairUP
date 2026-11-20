import type { Listing } from "./local-data";
import type { Attachment } from "./attachments";

export type Proposal = {
  id: string;
  listingId: string;
  senderId: number;
  senderName: string;
  status: "pending" | "accepted" | "declined";
  incoming: boolean;
  createdAt: string;
  listing: Listing;
};
export type Session = { id: number; name: string; role: "guest" | "presenter" };
export type Message = {
  authorProfile?: { id: number; name: string; avatar: string } | null;
  attachment?: Attachment | null;
  roomId?: string;
  generation?: number;
  id: string;
  seq: number;
  author: string;
  sessionId: number | null;
  text: string;
  kind: string;
  targetMessageId: string | null;
  createdAt: string;
};
export type AiStatus = {
  roomId?: string;
  generation?: number;
  id: string;
  status: string;
  error?: string | null;
} | null;
export type Snapshot = {
  references: { id: string; text: string }[];
  roomId: string;
  mode: "latest" | "older" | "after";
  hasOlder: boolean;
  messages: Message[];
  generation: number;
  hasMore: boolean;
  ai: AiStatus;
};
