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
import { AuthService } from "../auth/auth.service";
import { fail as toolError } from "../common/api-error";
import { RateLimiter } from "../core";
import { Profiles } from "./profiles.service";
@Controller("api")
export class ProfilesController {
  private limiter = new RateLimiter();
  constructor(
    @Inject(AuthService) private auth: AuthService,
    @Inject(Profiles) private profiles: Profiles,
  ) {}
  @Get("profiles/:id/summary") async summary(
    @Param("id") id: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    res.setHeader("Cache-Control", "no-store");
    return this.profiles.summary(Number(id));
  }
  @Get("profiles/:id") async publicProfile(
    @Param("id") id: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    res.setHeader("Cache-Control", "no-store");
    return this.profiles.get(Number(id));
  }
  @Get("me/profile") async mine(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    res.setHeader("Cache-Control", "no-store");
    const session = await this.auth.require(req.headers.cookie);
    const profile = await this.profiles.ensure(session);
    return this.profiles.get(profile.id);
  }
  @Post("me/profile") async save(@Req() req: Request, @Body() body: unknown) {
    const session = await this.auth.require(req.headers.cookie);
    if (!this.limiter.allow(String(session.id), 30, 60000))
      return toolError("RATE_LIMIT", 429);
    return this.profiles.save(session, body);
  }
}
