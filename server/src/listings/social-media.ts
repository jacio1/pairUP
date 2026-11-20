import { fail } from "../common/api-error";
import { FilesInterceptor } from "@nestjs/platform-express";
import {
  attachmentStorage,
  inspectFile,
  MAX_FILE_SIZE,
  removeStoredFile,
  safeFilename,
} from "../files/file-storage";

export const MAX_SOCIAL_FILES = 10;
export const SocialUpload = FilesInterceptor("files", MAX_SOCIAL_FILES, {
  storage: attachmentStorage,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: MAX_SOCIAL_FILES,
    fields: 2,
    fieldSize: 16000,
  },
});

export function discardMedia(ids: string[]) {
  return Promise.allSettled(ids.map(removeStoredFile));
}

export async function saveMedia<T>(
  files: Express.Multer.File[],
  save: (
    media: {
      id: string;
      name: string;
      kind: string;
      mime: string;
      position: number;
    }[],
  ) => Promise<T>,
) {
  try {
    if (files.reduce((total, file) => total + file.size, 0) > MAX_FILE_SIZE)
      return fail("FILE_TOO_LARGE", 413);
    const media = await Promise.all(
      files.map(async (file, position) => ({
        id: file.filename,
        name: safeFilename(file.originalname),
        position,
        ...(await inspectFile(file.filename)),
      })),
    );
    return await save(media);
  } catch (error) {
    await discardMedia(files.map((file) => file.filename));
    throw error;
  }
}
