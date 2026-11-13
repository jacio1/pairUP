import { mkdir, open, unlink } from "node:fs/promises";
import { resolve, join } from "node:path";
import { randomUUID } from "node:crypto";
import { diskStorage } from "multer";

export const MAX_FILE_SIZE = 50 * 1024 * 1024;
export const uploadDirectory = () =>
  resolve(process.env.UPLOAD_DIR || "uploads");
export const attachmentStorage = diskStorage({
  destination: (_req, _file, done) => {
    const directory = uploadDirectory();
    mkdir(directory, { recursive: true }).then(
      () => done(null, directory),
      (error) => done(error, ""),
    );
  },
  filename: (_req, _file, done) => done(null, randomUUID()),
});
export const attachmentPath = (key: string) => {
  if (!/^[0-9a-f-]{36}$/i.test(key)) throw new Error("Invalid storage key");
  return join(uploadDirectory(), key);
};
export const removeStoredFile = async (key: string) => {
  await unlink(attachmentPath(key)).catch((error) => {
    if (error.code !== "ENOENT") throw error;
  });
};
export function safeFilename(name: string) {
  if (!/[^\u0000-\u00ff]/.test(name)) {
    try {
      name = new TextDecoder("utf-8", { fatal: true }).decode(
        Buffer.from(name, "latin1"),
      );
    } catch {
      /* Already a non-UTF8 filename. */
    }
  }
  return (
    name
      .normalize("NFC")
      .replace(/[\x00-\x1f\x7f/\\]/g, "_")
      .replace(/^\.+/, "")
      .slice(0, 200)
      .trim() || "file"
  );
}
// Never trust the multipart Content-Type for inline rendering.
export function identifyMedia(bytes: Buffer): { kind: string; mime: string } {
  if (
    bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
  )
    return { kind: "image", mime: "image/png" };
  if (bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255)
    return { kind: "image", mime: "image/jpeg" };
  if (["GIF87a", "GIF89a"].includes(bytes.toString("ascii", 0, 6)))
    return { kind: "image", mime: "image/gif" };
  if (
    bytes.toString("ascii", 0, 4) === "RIFF" &&
    bytes.toString("ascii", 8, 12) === "WEBP"
  )
    return { kind: "image", mime: "image/webp" };
  if (
    bytes.toString("ascii", 4, 8) === "ftyp" &&
    [
      "isom",
      "iso2",
      "iso3",
      "iso4",
      "iso5",
      "iso6",
      "iso7",
      "iso8",
      "iso9",
      "mp41",
      "mp42",
      "avc1",
      "dash",
      "M4V ",
    ].includes(bytes.toString("ascii", 8, 12))
  )
    return { kind: "video", mime: "video/mp4" };
  if (
    bytes.subarray(0, 4).equals(Buffer.from([26, 69, 223, 163])) &&
    bytes.includes(Buffer.from("webm"))
  )
    return { kind: "video", mime: "video/webm" };
  return { kind: "file", mime: "application/octet-stream" };
}
export async function inspectFile(key: string) {
  const file = await open(attachmentPath(key), "r");
  try {
    const bytes = Buffer.alloc(4096);
    const { bytesRead } = await file.read(bytes, 0, bytes.length, 0);
    return identifyMedia(bytes.subarray(0, bytesRead));
  } finally {
    await file.close();
  }
}
