import { Body, Controller, Inject, Param, Post, Req } from "@nestjs/common";
import type { Request } from "express";
import { AuthService } from "../auth/auth.service";
import { AiService } from "./ai.service";
@Controller("api")
export class AiController {
  constructor(
    @Inject(AuthService) private auth: AuthService,
    @Inject(AiService) private aiService: AiService,
  ) {}
  @Post("rooms/:id/ai/requests") async ai(
    @Req() req: Request,
    @Param("id") id: string,
    @Body() body: Parameters<AiService["requestAi"]>[1],
  ) {
    const session = await this.auth.roomAccess(req.headers.cookie, id);
    return this.aiService.requestAi(this.auth.view(session), body, id);
  }
}
