import { Inject, Injectable } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";
import { validId } from "./core";
import { noteState, toolError, versionInput } from "./study-note";

@Injectable()
export class StudyTools {
  constructor(@Inject("STUDY_DATABASE") private db: PrismaClient) {}
  snapshot(roomId: string) {
    return this.db.$transaction(async (tx) => ({
      notes: await tx.studyNote.findMany({
        where: { roomId },
        orderBy: [{ createdAt: "asc" }, { id: "asc" }],
        select: {
          id: true,
          title: true,
          version: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      tasks: await tx.studyTask.findMany({
        where: { roomId },
        orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      }),
    }));
  }
  async note(roomId: string, id: string) {
    const note = await this.db.studyNote.findFirst({ where: { id, roomId } });
    if (!note) return toolError("NOT_FOUND", 404);
    return { ...note, state: Buffer.from(note.state).toString("base64") };
  }
  async createNote(roomId: string, input: { id?: unknown }) {
    if (!validId(input?.id)) return toolError("INVALID_INPUT");
    const id = input.id as string;
    await this.db.$transaction(async (tx) => {
      // Lock only this room: counts remain bounded even with concurrent API instances.
      await tx.$queryRaw`SELECT id FROM "Room" WHERE id = ${roomId} FOR UPDATE`;
      const existing = await tx.studyNote.findUnique({ where: { id } });
      if (existing) {
        if (existing.roomId !== roomId) toolError("FORBIDDEN", 403);
        return;
      }
      if ((await tx.studyNote.count({ where: { roomId } })) >= 30)
        return toolError("TOOL_LIMIT");
      await tx.studyNote.create({
        data: { id, roomId, ...noteState(undefined) },
      });
    });
    return this.note(roomId, id);
  }
  async updateNote(roomId: string, id: string, input: { state?: unknown }) {
    if (!input || typeof input.state !== "string")
      return toolError("INVALID_INPUT");
    for (let attempt = 0; attempt < 12; attempt++) {
      const existing = await this.db.studyNote.findFirst({
        where: { roomId, id },
      });
      if (!existing) return toolError("NOT_FOUND", 404);
      const merged = noteState(existing.state, input.state);
      if (Buffer.from(existing.state).equals(merged.state))
        return this.note(roomId, id);
      const result = await this.db.studyNote.updateMany({
        where: { roomId, id, version: existing.version },
        data: { ...merged, version: { increment: 1 } },
      });
      if (result.count) return this.note(roomId, id);
    }
    return toolError("TOOL_CONFLICT", 409);
  }
  async deleteNote(roomId: string, id: string, input: { version?: unknown }) {
    const version = versionInput(input?.version);
    const result = await this.db.studyNote.deleteMany({
      where: { id, roomId, version },
    });
    if (!result.count) {
      if (await this.db.studyNote.count({ where: { id, roomId } }))
        return toolError("TOOL_CONFLICT", 409);
    }
    return { ok: true };
  }
  async createTask(roomId: string, input: { id?: unknown; title?: unknown }) {
    if (
      !validId(input?.id) ||
      typeof input.title !== "string" ||
      !input.title.trim() ||
      input.title.trim().length > 300
    )
      return toolError("INVALID_INPUT");
    const id = input.id as string,
      title = input.title.trim();
    return this.db.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM "Room" WHERE id = ${roomId} FOR UPDATE`;
      const existing = await tx.studyTask.findUnique({ where: { id } });
      if (existing) {
        if (existing.roomId !== roomId) return toolError("FORBIDDEN", 403);
        return existing;
      }
      if ((await tx.studyTask.count({ where: { roomId } })) >= 100)
        return toolError("TOOL_LIMIT");
      return tx.studyTask.create({ data: { id, roomId, title } });
    });
  }
  async updateTask(
    roomId: string,
    id: string,
    input: { version?: unknown; title?: unknown; completed?: unknown },
  ) {
    const version = versionInput(input?.version);
    const data: {
      title?: string;
      completed?: boolean;
      version: { increment: number };
    } = { version: { increment: 1 } };
    if (input.title !== undefined) {
      if (
        typeof input.title !== "string" ||
        !input.title.trim() ||
        input.title.trim().length > 300
      )
        return toolError("INVALID_INPUT");
      data.title = input.title.trim();
    }
    if (input.completed !== undefined) {
      if (typeof input.completed !== "boolean")
        return toolError("INVALID_INPUT");
      data.completed = input.completed;
    }
    if (data.title === undefined && data.completed === undefined)
      return toolError("INVALID_INPUT");
    const result = await this.db.studyTask.updateMany({
      where: { id, roomId, version },
      data,
    });
    if (!result.count) return toolError("TOOL_CONFLICT", 409);
    return this.db.studyTask.findUniqueOrThrow({ where: { id } });
  }
  async deleteTask(roomId: string, id: string, input: { version?: unknown }) {
    const version = versionInput(input?.version);
    const result = await this.db.studyTask.deleteMany({
      where: { id, roomId, version },
    });
    if (
      !result.count &&
      (await this.db.studyTask.count({ where: { id, roomId } }))
    )
      return toolError("TOOL_CONFLICT", 409);
    return { ok: true };
  }
}
