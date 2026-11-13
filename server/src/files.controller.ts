import {
  ArgumentsHost,
  Body,
  CanActivate,
  Catch,
  Controller,
  ExceptionFilter,
  ExecutionContext,
  Get,
  HttpException,
  Inject,
  Injectable,
  Param,
  Post,
  Query,
  Req,
  Res,
  UploadedFile,
  UseFilters,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import type { Request, Response } from "express";
import type { Auth, Realtime } from "./app";
import { Files } from "./files";
import {
  attachmentPath,
  attachmentStorage,
  MAX_FILE_SIZE,
} from "./file-storage";
import { RateLimiter } from "./core";
import { toolError } from "./study-note";
import { stat } from "node:fs/promises";

type FileRequest = Request & { fileSession: { id: number; name: string } };
@Injectable()
export class FileRoomGuard implements CanActivate {
  private limiter = new RateLimiter();
  constructor(@Inject("FILES_ACCESS") private auth: Auth) {}
  async canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest<FileRequest>();
    const session = await this.auth.roomAccess(
      req.headers.cookie,
      String(req.params.roomId),
    );
    if (
      req.method === "POST" &&
      !this.limiter.allow(String(session.id), 30, 600000)
    )
      return toolError("RATE_LIMIT", 429);
    req.fileSession = this.auth.view(session);
    return true;
  }
}
@Catch()
export class FileErrorFilter implements ExceptionFilter {
  catch(error: unknown, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();
    if (response.headersSent) return;
    const status = error instanceof HttpException ? error.getStatus() : 500;
    const code =
      error instanceof HttpException
        ? (error.getResponse() as { code?: string })?.code
        : undefined;
    response.status(status).json({
      code:
        code ||
        (status === 413
          ? "FILE_TOO_LARGE"
          : status === 400
            ? "INVALID_UPLOAD"
            : "SERVER_ERROR"),
    });
  }
}
@Controller("api/rooms/:roomId/files")
@UseGuards(FileRoomGuard)
@UseFilters(FileErrorFilter)
export class FilesController {
  constructor(
    @Inject(Files) private files: Files,
    @Inject("FILES_REALTIME") private rt: Realtime,
  ) {}
  @Get() list(
    @Param("roomId") roomId: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    res.setHeader("Cache-Control", "no-store");
    return this.files.list(roomId);
  }
  @Post()
  @UseInterceptors(
    FileInterceptor("file", {
      storage: attachmentStorage,
      limits: {
        fileSize: MAX_FILE_SIZE,
        files: 1,
        fields: 1,
        fieldSize: 100,
        parts: 2,
      },
    }),
  )
  async upload(
    @Req() req: FileRequest,
    @Param("roomId") roomId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { clientRequestId?: unknown },
  ) {
    const result = await this.files.upload(
      roomId,
      req.fileSession,
      file,
      body?.clientRequestId,
    );
    if (result.created && result.message)
      this.rt.emit("message:created", result.message, roomId);
    this.rt.emit("files:changed", {}, roomId);
    return { attachment: result.attachment, message: result.message };
  }
  @Get(":id/content") async content(
    @Param("roomId") roomId: string,
    @Param("id") id: string,
    @Query("download") download: string | undefined,
    @Res() res: Response,
  ) {
    const file = await this.files.find(roomId, id),
      path = attachmentPath(file.storageKey);
    try {
      await stat(path);
    } catch {
      return toolError("FILE_UNAVAILABLE", 404);
    }
    res.setHeader("Cache-Control", "private, no-store");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Content-Security-Policy", "default-src 'none'; sandbox");
    if (download === "1" || file.kind === "file")
      return res.download(path, file.name);
    res.setHeader("Cache-Control", "private, no-cache, must-revalidate");
    res.setHeader("ETag", `"media-${file.id}-${file.size}"`);
    res.type(file.mime);
    return res.sendFile(path, { acceptRanges: true });
  }
}
