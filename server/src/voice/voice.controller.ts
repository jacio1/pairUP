import { Controller, Inject, Param, Post, Req, Res } from "@nestjs/common";
import type { Request, Response } from "express";
import { AuthService } from "../auth/auth.service";
import { fail } from "../common/api-error";
import { RateLimiter } from "../core";
import { VoiceService } from "./voice.service";
@Controller("api")
export class VoiceController {
  private voiceLimiter = new RateLimiter();
  constructor(
    @Inject(AuthService) private auth: AuthService,
    @Inject(VoiceService) private voice: VoiceService,
  ) {}
  @Post("rooms/:id/voice/token") async voiceToken(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Param("id") id: string,
  ) {
    const session = await this.auth.roomAccess(req.headers.cookie, id);
    if (!this.voiceLimiter.allow(String(session.id), 12, 60000))
      return fail("RATE_LIMIT", 429);
    res.setHeader("Cache-Control", "no-store");
    return this.voice.token(id, this.auth.view(session), session.expiresAt);
  }
}
