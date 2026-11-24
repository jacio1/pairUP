import { Inject, Injectable } from "@nestjs/common";
import { fail } from "../common/api-error";
import { ROOM, validId, validText } from "../core";
import { lockChatTransaction } from "../database/chat-lock";
import { Database } from "../database/database.service";
import { messageAuthor, profileAuthor } from "../profiles/profiles.service";
import { Realtime } from "../realtime/realtime.gateway";
import { buildContext } from "./ai-context";
import { AiRunner } from "./ai-runner.service";
@Injectable()
export class AiService {
  constructor(
    @Inject(Database) private db: Database,
    @Inject(Realtime) private rt: Realtime,
    @Inject(AiRunner) private runner: AiRunner,
  ) {}
  async requestAi(
    session: { id: number; name: string },
    data: {
      clientRequestId?: unknown;
      prompt?: unknown;
      locale?: unknown;
      targetMessageId?: unknown;
      tool?: unknown;
      noteId?: unknown;
    },
    roomId = ROOM,
  ) {
    if (
      !data ||
      !validId(data.clientRequestId) ||
      !validText(data.prompt, 2000) ||
      !["en", "ru"].includes(data.locale as string) ||
      (data.targetMessageId !== undefined && !validId(data.targetMessageId)) ||
      (data.tool !== undefined && !["notes", "tasks", "pomodoro"].includes(data.tool as string)) ||
      (data.noteId !== undefined && (data.tool !== "notes" || !validId(data.noteId)))
    )
      return fail("INVALID_INPUT");
    const tool = data.tool as "notes" | "tasks" | "pomodoro" | undefined;
    const noteId = data.noteId as string | undefined;
    const requestId = `ai:${roomId}:${session.id}:${data.clientRequestId}`;
    const result = await this.db.$transaction(async (tx) => {
      await lockChatTransaction(tx);
      const existing = await tx.aiJob.findUnique({
        where: { clientRequestId: requestId },
      });
      if (existing) return { job: existing, messages: null, message: null };
      const room = await tx.room.findUniqueOrThrow({ where: { id: roomId } });
      if (noteId && !(await tx.studyNote.findFirst({ where: { id: noteId, roomId }, select: { id: true } })))
        return fail("NOT_FOUND", 404);
      const latest = await tx.aiJob.findFirst({
        where: { roomId: roomId, generation: room.generation },
        orderBy: { createdAt: "desc" },
      });
      if (
        latest &&
        (["pending", "running"].includes(latest.status) ||
          Date.now() - latest.createdAt.getTime() < 15000)
      )
        return fail("AI_BUSY", 429);
      const target = data.targetMessageId
        ? await tx.message.findFirst({
            where: {
              id: data.targetMessageId as string,
              roomId: roomId,
              kind: { not: "deleted" },
            },
          })
        : null;
      if (data.targetMessageId && !target)
        return fail("MESSAGE_NOT_FOUND", 404);
      const rows = await tx.message.findMany({
        where: {
          roomId: roomId,
          kind: "human",
          ...(target ? { seq: { lte: target.seq } } : {}),
        },
        orderBy: { seq: "desc" },
        take: target ? 11 : 20,
      });
      const priorPairs = await tx.message.findMany({
        where: {
          roomId: roomId,
          kind: { in: ["ai-request", "ai"] },
          ...(target ? { seq: { lte: target.seq } } : {}),
        },
        orderBy: { seq: "desc" },
        take: 8,
      });
      const paired = priorPairs
        .filter((m) => m.kind === "ai")
        .slice(0, 2)
        .flatMap((answer) => {
          const request = priorPairs.find(
            (m) => m.id === answer.targetMessageId && m.kind === "ai-request",
          );
          return request ? [request, answer] : [];
        });
      const context = [...rows, ...paired].sort((a, b) => a.seq - b.seq);
      // Ensure the selected message is present even when it is an AI response.
      if (target && !context.some((m) => m.id === target.id))
        context.push(target);
      const job = await tx.aiJob.create({
        data: {
          roomId: roomId,
          clientRequestId: requestId,
          prompt: (data.prompt as string).trim(),
          locale: data.locale as string,
          targetMessageId: target?.id,
          generation: room.generation,
          status: "running",
        },
      });
      const message = await tx.message.create({
        include: { authorProfile: profileAuthor },
        data: {
          roomId: roomId,
          author: session.name,
          authorProfileId: (await messageAuthor(tx, session)).id,
          sessionId: session.id,
          kind: "ai-request",
          text: job.prompt,
          clientRequestId: `job-request:${job.id}`,
          targetMessageId: target?.id,
        },
      });
      const messages = buildContext(context, job.prompt, job.locale);
      if (tool === "notes") {
        messages[0].content += noteId
          ? ' The request comes from a selected note. When asked to write or add text to the selected note, use {"type":"append_note","body":"text to append"} in the action array. Only create a new note if the user asks for a new note. Appending preserves the existing text.'
          : " The request comes from the Notes tab with no selected note. When asked to save text as a note, create a note with a short title.";
      } else if (tool) {
        messages[0].content += tool === "tasks"
          ? " The request comes from the Tasks tab and can only create tasks."
          : " The request comes from the Timer tab and can only start, pause, or reset the timer.";
      }
      return {
        job,
        messages,
        message,
      };
    });
    if (result.messages) {
      this.rt.emit(
        "message:created",
        {
          ...result.message,
          generation: result.job.generation,
        },
        roomId,
      );
      this.rt.emit(
        "ai:status",
        {
          id: result.job.id,
          status: "running",
          generation: result.job.generation,
        },
        roomId,
      );
      void this.runner.run(
        result.job.id,
        result.job.generation,
        result.messages,
        result.message!.id,
        roomId,
        { tool, noteId },
      );
    }
    return {
      roomId,
      id: result.job.id,
      status: result.job.status,
      generation: result.job.generation,
    };
  }
}
