import {
  Inject,
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
} from "@nestjs/common";
import { AiRunner } from "../ai/ai-runner.service";
import { AuthService } from "../auth/auth.service";
import { fail } from "../common/api-error";
import { RateLimiter, ROOM, validId, validText } from "../core";
import { lockChatTransaction } from "../database/chat-lock";
import { Database } from "../database/database.service";
import { messageAuthor, profileAuthor } from "../profiles/profiles.service";
import { Realtime } from "../realtime/realtime.gateway";
@Injectable()
export class Chat implements OnModuleInit, OnModuleDestroy {
  private limiter = new RateLimiter();
  private stopMessageHandler?: () => void;
  constructor(
    @Inject(Database) private db: Database,
    @Inject(AuthService) private auth: AuthService,
    @Inject(Realtime) private rt: Realtime,
    @Inject(AiRunner) private aiRunner: AiRunner,
  ) {}
  onModuleInit() {
    this.stopMessageHandler = this.rt.registerMessageHandler(
      async (socket, payload) => {
        const roomId = socket.data.roomId;
        if (!roomId) return fail("FORBIDDEN", 403);
        const session = await this.auth.roomAccess(
          socket.handshake.headers.cookie,
          roomId,
        );
        return this.send(this.auth.view(session), payload, roomId);
      },
    );
  }
  onModuleDestroy() {
    this.stopMessageHandler?.();
  }
  async send(
    session: { id: number; name: string },
    raw: unknown,
    roomId = ROOM,
  ) {
    const data = raw as { clientRequestId?: unknown; text?: unknown };
    if (!data || !validId(data.clientRequestId) || !validText(data.text, 1000))
      return fail("INVALID_INPUT");
    const requestId = `message:${roomId}:${session.id}:${data.clientRequestId}`;
    const result = await this.db.$transaction(async (tx) => {
      await lockChatTransaction(tx);
      const room = await tx.room.findUniqueOrThrow({ where: { id: roomId } });
      const existing = await tx.message.findUnique({
        include: { authorProfile: profileAuthor },
        where: { clientRequestId: requestId },
      });
      if (existing)
        return {
          message: { ...existing, generation: room.generation },
          created: false,
        };
      if (!this.limiter.allow(`send:${session.id}`, 5, 10000))
        return fail("RATE_LIMIT", 429);
      return {
        message: await tx.message.create({
          include: { authorProfile: profileAuthor },
          data: {
            roomId: roomId,
            author: session.name,
            authorProfileId: (await messageAuthor(tx, session)).id,
            sessionId: session.id,
            text: (data.text as string).trim(),
            clientRequestId: requestId,
          },
        }),
        created: true,
        generation: room.generation,
      };
    });
    const message = {
      ...result.message,
      generation: result.generation ?? result.message.generation,
    };
    if (result.created) this.rt.emit("message:created", message, roomId);
    return message;
  }
  async reset(roomId = ROOM) {
    const room = await this.db.$transaction(async (tx) => {
      await lockChatTransaction(tx);
      await tx.message.deleteMany({ where: { roomId: roomId } });
      await tx.aiJob.updateMany({
        where: { roomId: roomId, status: { in: ["pending", "running"] } },
        data: { status: "cancelled" },
      });
      return tx.room.update({
        where: { id: roomId },
        data: { generation: { increment: 1 } },
      });
    });
    await this.aiRunner.cancelRoom(roomId);
    this.rt.emit("room:reset", { generation: room.generation }, roomId);
    return { ok: true };
  }
}
