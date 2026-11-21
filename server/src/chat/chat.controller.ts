import {
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Post,
  Query,
  Req,
} from "@nestjs/common";
import type { Request } from "express";
import { AuthService } from "../auth/auth.service";
import { ChatHistory } from "./chat-history.service";
import { Chat } from "./chat.service";
@Controller("api")
export class ChatController {
  constructor(
    @Inject(AuthService) private auth: AuthService,
    @Inject(Chat) private chat: Chat,
    @Inject(ChatHistory) private history: ChatHistory,
  ) {}
  @Delete("rooms/:id/messages/:messageId")
  async deleteMessage(
    @Req() req: Request,
    @Param("id") id: string,
    @Param("messageId") messageId: string,
  ) {
    const session = await this.auth.roomAccess(req.headers.cookie, id);
    return this.chat.deleteMessage(this.auth.view(session).id, id, messageId);
  }
  @Get("rooms/:id/messages") async messages(
    @Req() req: Request,
    @Param("id") id: string,
    @Query("after") after?: string,
    @Query("before") before?: string,
    @Query("generation") generation?: string,
  ) {
    await this.auth.roomAccess(req.headers.cookie, id);
    return this.history.snapshot(
      after === undefined ? undefined : Number(after),
      id,
      before === undefined ? undefined : Number(before),
      generation === undefined ? undefined : Number(generation),
    );
  }
  @Post("rooms/:id/reset") async reset(
    @Req() req: Request,
    @Param("id") id: string,
  ) {
    await this.auth.roomAccess(req.headers.cookie, id);
    await this.auth.require(req.headers.cookie, true);
    return this.chat.reset(id);
  }
}
