import { Inject, Injectable } from "@nestjs/common";
import { PrismaClient, Prisma } from "@prisma/client";
import { boardElement, type BoardElement } from "./board-element";
import { changeTimer, type TimerInput } from "./room-timer";
import { toolError, versionInput } from "./study-note";
@Injectable()
export class RoomActivities {
  constructor(@Inject("STUDY_DATABASE") private db: PrismaClient) {}
  async timer(roomId: string) {
    const timer = await this.db.roomTimer.upsert({
      where: { roomId },
      create: { roomId },
      update: {},
    });
    return { ...timer, serverNow: Date.now() };
  }
  async updateTimer(roomId: string, input: TimerInput) {
    return this.db.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM "Room" WHERE id=${roomId} FOR UPDATE`;
      const current = await tx.roomTimer.upsert({
        where: { roomId },
        create: { roomId },
        update: {},
      });
      const { roomId: _, ...data } = changeTimer(current, input, Date.now());
      const timer = await tx.roomTimer.update({ where: { roomId }, data });
      return { ...timer, serverNow: Date.now() };
    });
  }
  board(roomId: string) {
    return this.db.roomBoard.upsert({
      where: { roomId },
      create: { roomId },
      update: {},
    });
  }
  async updateBoard(
    roomId: string,
    input: {
      action?: string;
      generation?: number;
      version?: number;
      element?: unknown;
      id?: string;
    },
  ) {
    if (!input || !["add", "remove", "clear"].includes(input.action || ""))
      return toolError("INVALID_INPUT");
    const generation = versionInput(input.generation);
    const element =
      input.action === "add" ? boardElement(input.element) : undefined;
    return this.db.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM "Room" WHERE id=${roomId} FOR UPDATE`;
      const board = await tx.roomBoard.upsert({
        where: { roomId },
        create: { roomId },
        update: {},
      });
      if (board.generation !== generation)
        return toolError("TOOL_CONFLICT", 409);
      let elements = board.elements as BoardElement[];
      if (input.action === "clear") {
        if (versionInput(input.version) !== board.version)
          return toolError("TOOL_CONFLICT", 409);
        return tx.roomBoard.update({
          where: { roomId },
          data: {
            elements: [],
            generation: { increment: 1 },
            version: { increment: 1 },
          },
        });
      }
      if (element) {
        if (elements.some((e) => e.id === element.id)) return board;
        if (elements.length >= 300) return toolError("TOOL_LIMIT");
        elements = [...elements, element];
      } else {
        if (typeof input.id !== "string") return toolError("INVALID_INPUT");
        elements = elements.filter((e) => e.id !== input.id);
      }
      return tx.roomBoard.update({
        where: { roomId },
        data: {
          elements: elements as unknown as Prisma.InputJsonValue,
          version: { increment: 1 },
        },
      });
    });
  }
}
