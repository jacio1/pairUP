import { RoomActivities } from "./room-activities";
import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Post,
  Req,
  Res,
} from "@nestjs/common";
import type { Request, Response } from "express";
import type { Auth, Realtime } from "./app";
import { RateLimiter } from "./core";
import { toolError } from "./study-note";
import { StudyTools } from "./study-tools";

@Controller("api/rooms/:roomId/tools")
export class StudyToolsController {
  private limiter = new RateLimiter();
  constructor(
    @Inject("STUDY_ACCESS") private auth: Auth,
    @Inject("STUDY_REALTIME") private rt: Realtime,
    @Inject(StudyTools) private tools: StudyTools,
    @Inject(RoomActivities) private activities: RoomActivities,
  ) {}
  private async access(req: Request, roomId: string, write = false) {
    const session = await this.auth.roomAccess(req.headers.cookie, roomId);
    if (write && !this.limiter.allow(String(session.id), 180, 60000))
      toolError("RATE_LIMIT", 429);
  }
  private async change<T>(
    req: Request,
    roomId: string,
    work: () => Promise<T>,
    noteId?: string,
  ) {
    await this.access(req, roomId, true);
    const result = await work();
    this.rt.emit("tools:changed", { noteId }, roomId);
    return result;
  }
  @Get("timer") async timer(
    @Req() req: Request,
    @Param("roomId") roomId: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.access(req, roomId);
    res.setHeader("Cache-Control", "no-store");
    return this.activities.timer(roomId);
  }
  @Post("timer") updateTimer(
    @Req() req: Request,
    @Param("roomId") roomId: string,
    @Body() body: Parameters<RoomActivities["updateTimer"]>[1],
  ) {
    return this.change(req, roomId, () =>
      this.activities.updateTimer(roomId, body),
    );
  }
  @Get("board") async board(
    @Req() req: Request,
    @Param("roomId") roomId: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.access(req, roomId);
    res.setHeader("Cache-Control", "no-store");
    return this.activities.board(roomId);
  }
  @Post("board") updateBoard(
    @Req() req: Request,
    @Param("roomId") roomId: string,
    @Body() body: Parameters<RoomActivities["updateBoard"]>[1],
  ) {
    return this.change(req, roomId, () =>
      this.activities.updateBoard(roomId, body),
    );
  }
  @Get() async snapshot(
    @Req() req: Request,
    @Param("roomId") roomId: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.access(req, roomId);
    res.setHeader("Cache-Control", "no-store");
    return this.tools.snapshot(roomId);
  }
  @Get("notes/:id") async note(
    @Req() req: Request,
    @Param("roomId") roomId: string,
    @Param("id") id: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.access(req, roomId);
    res.setHeader("Cache-Control", "no-store");
    return this.tools.note(roomId, id);
  }
  @Post("notes") createNote(
    @Req() req: Request,
    @Param("roomId") roomId: string,
    @Body() body: Parameters<StudyTools["createNote"]>[1],
  ) {
    return this.change(req, roomId, () => this.tools.createNote(roomId, body));
  }
  @Post("notes/:id") updateNote(
    @Req() req: Request,
    @Param("roomId") roomId: string,
    @Param("id") id: string,
    @Body() body: Parameters<StudyTools["updateNote"]>[2],
  ) {
    return this.change(
      req,
      roomId,
      () => this.tools.updateNote(roomId, id, body),
      id,
    );
  }
  @Post("notes/:id/delete") deleteNote(
    @Req() req: Request,
    @Param("roomId") roomId: string,
    @Param("id") id: string,
    @Body() body: Parameters<StudyTools["deleteNote"]>[2],
  ) {
    return this.change(
      req,
      roomId,
      () => this.tools.deleteNote(roomId, id, body),
      id,
    );
  }
  @Post("tasks") createTask(
    @Req() req: Request,
    @Param("roomId") roomId: string,
    @Body() body: Parameters<StudyTools["createTask"]>[1],
  ) {
    return this.change(req, roomId, () => this.tools.createTask(roomId, body));
  }
  @Post("tasks/:id") updateTask(
    @Req() req: Request,
    @Param("roomId") roomId: string,
    @Param("id") id: string,
    @Body() body: Parameters<StudyTools["updateTask"]>[2],
  ) {
    return this.change(req, roomId, () =>
      this.tools.updateTask(roomId, id, body),
    );
  }
  @Post("tasks/:id/delete") deleteTask(
    @Req() req: Request,
    @Param("roomId") roomId: string,
    @Param("id") id: string,
    @Body() body: Parameters<StudyTools["deleteTask"]>[2],
  ) {
    return this.change(req, roomId, () =>
      this.tools.deleteTask(roomId, id, body),
    );
  }
}
