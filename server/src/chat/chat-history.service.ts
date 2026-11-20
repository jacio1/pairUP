import { Inject, Injectable } from "@nestjs/common";
import { fail } from "../common/api-error";
import { ROOM } from "../core";
import { lockChatTransaction } from "../database/chat-lock";
import { Database } from "../database/database.service";
import { attachmentFields } from "../files/files.service";
import { profileAuthor } from "../profiles/profiles.service";
import { HISTORY_PAGE_SIZE, historyWindow } from "./history";
@Injectable()
export class ChatHistory {
  constructor(@Inject(Database) private db: Database) {}
  async snapshot(
    after: number | undefined = undefined,
    roomId = ROOM,
    before?: number,
    generation?: number,
  ) {
    const window = historyWindow(after, before);
    return this.db.$transaction(async (tx) => {
      await lockChatTransaction(tx);
      const room = await tx.room.findUniqueOrThrow({ where: { id: roomId } });
      if (generation !== undefined && generation !== room.generation)
        return fail("HISTORY_CHANGED", 409);
      const messages = await tx.message.findMany({
        include: {
          attachment: { select: attachmentFields },
          authorProfile: profileAuthor,
        },
        where: { roomId: roomId, seq: window.where },
        orderBy: { seq: window.order },
        take: HISTORY_PAGE_SIZE + 1,
      });
      const parentIds = messages
        .slice(0, HISTORY_PAGE_SIZE)
        .flatMap((m) => (m.targetMessageId ? [m.targetMessageId] : []));
      const references = parentIds.length
        ? await tx.message.findMany({
            where: { roomId, id: { in: parentIds } },
            select: { id: true, text: true },
          })
        : [];
      const job = await tx.aiJob.findFirst({
        where: { roomId: roomId, generation: room.generation },
        orderBy: { createdAt: "desc" },
      });
      return {
        references: references.map((m) => ({
          ...m,
          text: m.text.slice(0, 160),
        })),
        roomId,
        mode: window.mode,
        hasOlder:
          window.mode !== "after" && messages.length > HISTORY_PAGE_SIZE,
        messages: (window.order === "desc"
          ? messages.slice(0, HISTORY_PAGE_SIZE).reverse()
          : messages.slice(0, HISTORY_PAGE_SIZE)
        ).map((message) => ({
          ...message,
          generation: room.generation,
        })),
        generation: room.generation,
        hasMore: window.mode === "after" && messages.length > HISTORY_PAGE_SIZE,
        ai: job
          ? {
              id: job.id,
              status: job.status,
              error: job.error,
              generation: room.generation,
            }
          : null,
      };
    });
  }
}
