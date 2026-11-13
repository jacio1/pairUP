import { Inject, Injectable } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";
import { validId } from "./core";
import { toolError } from "./study-note";
import { inspectFile, removeStoredFile, safeFilename } from "./file-storage";
export const attachmentFields = {
  id: true,
  roomId: true,
  messageId: true,
  name: true,
  size: true,
  mime: true,
  kind: true,
  author: true,
  createdAt: true,
} as const;
@Injectable()
export class Files {
  constructor(@Inject("FILES_DATABASE") private db: PrismaClient) {}
  list(roomId: string) {
    return this.db.attachment.findMany({
      where: { roomId },
      select: attachmentFields,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: 200,
    });
  }
  async find(roomId: string, id: string) {
    const file = await this.db.attachment.findFirst({ where: { roomId, id } });
    if (!file) return toolError("NOT_FOUND", 404);
    return file;
  }
  async upload(
    roomId: string,
    session: { id: number; name: string },
    file: Express.Multer.File | undefined,
    request: unknown,
  ) {
    if (!file) return toolError("INVALID_UPLOAD");
    let retained = false;
    try {
      if (!validId(request) || file.size === 0)
        return toolError("INVALID_UPLOAD");
      const media = await inspectFile(file.filename),
        name = safeFilename(file.originalname);
      const result = await this.db.$transaction(async (tx) => {
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(735901)`;
        await tx.$queryRaw`SELECT id FROM "Room" WHERE id=${roomId} FOR UPDATE`;
        const room = await tx.room.findUniqueOrThrow({ where: { id: roomId } });
        const clientRequestId = `file:${roomId}:${session.id}:${request}`;
        const existing = await tx.attachment.findUnique({
          where: { clientRequestId },
          select: attachmentFields,
        });
        if (existing) {
          const message = existing.messageId
            ? await tx.message.findUnique({
                where: { id: existing.messageId },
                include: { attachment: { select: attachmentFields } },
              })
            : null;
          return {
            attachment: existing,
            message: message
              ? { ...message, generation: room.generation }
              : null,
            created: false,
          };
        }
        const quota = await tx.attachment.aggregate({
          where: { roomId },
          _count: true,
          _sum: { size: true },
        });
        if (
          quota._count >= 200 ||
          (quota._sum.size || 0) + file.size > 500 * 1024 * 1024
        )
          return toolError("ROOM_STORAGE_LIMIT", 413);
        const message = await tx.message.create({
          data: {
            roomId,
            sessionId: session.id,
            author: session.name,
            kind: "attachment",
            text: name,
            clientRequestId,
          },
        });
        const attachment = await tx.attachment.create({
          data: {
            roomId,
            messageId: message.id,
            storageKey: file.filename,
            clientRequestId,
            name,
            size: file.size,
            ...media,
            author: session.name,
          },
          select: attachmentFields,
        });
        return {
          attachment,
          message: { ...message, attachment, generation: room.generation },
          created: true,
        };
      });
      retained = result.created;
      return result;
    } finally {
      if (!retained) await removeStoredFile(file.filename);
    }
  }
}
