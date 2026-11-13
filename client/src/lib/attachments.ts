export type Attachment = {
  id: string;
  roomId: string;
  messageId: string | null;
  name: string;
  size: number;
  mime: string;
  kind: "image" | "video" | "file";
  author: string;
  createdAt: string;
};
export const fileUrl = (file: Attachment, download = false) =>
  `/api/rooms/${encodeURIComponent(file.roomId)}/files/${encodeURIComponent(file.id)}/content${download ? "?download=1" : ""}`;
export function fileSize(bytes: number, locale: string) {
  const unit = bytes >= 1048576 ? "MB" : bytes >= 1024 ? "KB" : "B";
  return `${new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(bytes / (unit === "MB" ? 1048576 : unit === "KB" ? 1024 : 1))} ${unit}`;
}
