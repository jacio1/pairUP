import { Controller, Get, Post, Req, Res, Body, Inject } from "@nestjs/common";
import type { Request, Response } from "express";
import { AuthService } from "./auth.service";

@Controller("api")
export class AuthController {
  constructor(@Inject(AuthService) private auth: AuthService) {}
  @Post("auth/demo") demo(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.auth.login(req, res, false);
  }
  @Post("auth/presenter") presenter(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Body() body: { password?: unknown },
  ) {
    return this.auth.login(req, res, true, body?.password);
  }
  @Get("me") async me(@Req() req: Request) {
    const session = await this.auth.session(req.headers.cookie);
    return session ? this.auth.view(session) : null;
  }
  @Post("auth/logout") logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.auth.logout(req, res);
  }
}
