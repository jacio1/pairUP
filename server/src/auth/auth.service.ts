import { Injectable, Inject, HttpException } from "@nestjs/common";
import { parse, serialize } from "cookie";
import { randomBytes } from "node:crypto";
import type { Request, Response } from "express";
import { Database } from "../database/database.service";
import { hash, secretEquals, RateLimiter } from "../core";
import { AuthSessionEvents } from "./auth-session.events";

const sessionCookie = "PAIRUP_SESSION";
const fail = (code: string, status = 400): never => {
  throw new HttpException({ code }, status);
};

@Injectable()
export class AuthService {
  limiter = new RateLimiter();
  constructor(
    @Inject(Database) private db: Database,
    @Inject(AuthSessionEvents) private sessionEvents: AuthSessionEvents,
  ) {}
  async session(cookie?: string) {
    const token = parse(cookie || "")[sessionCookie];
    if (!token || token.length > 100) return null;
    const session = await this.db.session.findUnique({
      where: { tokenHash: hash(token) },
      include: { user: true },
    });
    return session && session.expiresAt > new Date() ? session : null;
  }
  async require(cookie?: string, presenter = false) {
    const session = await this.session(cookie);
    if (!session) return fail("UNAUTHORIZED", 401);
    if (presenter && session.user.role !== "presenter")
      return fail("FORBIDDEN", 403);
    return session;
  }
  view(session: NonNullable<Awaited<ReturnType<AuthService["session"]>>>) {
    return {
      id: session.id,
      role: session.user.role,
      name:
        session.user.role === "presenter" ? "Presenter" : `TEST #${session.id}`,
    };
  }
  async roomAccess(cookie: string | undefined, roomId: string) {
    const session = await this.require(cookie);
    const listing = await this.db.listing.findUnique({ where: { roomId } });
    if (!listing) return fail("NOT_FOUND", 404);
    if (listing.id === "demo-listing") return session;
    const owner =
      listing.ownerSessionId === session.id ||
      (listing.id === "demo-listing" && session.user.role === "presenter");
    const accepted = await this.db.sessionProposal.findFirst({
      where: {
        listingId: listing.id,
        senderId: session.id,
        status: "accepted",
      },
    });
    if (!owner && !accepted) return fail("FORBIDDEN", 403);
    return session;
  }
  async login(
    req: Request,
    res: Response,
    presenter: boolean,
    password?: unknown,
  ) {
    if (!this.limiter.allow(`login:${req.ip}`, presenter ? 10 : 100, 60000))
      return fail("RATE_LIMIT", 429);
    if (
      presenter &&
      (typeof password !== "string" ||
        !secretEquals(password, process.env.PRESENTER_PASSWORD!))
    )
      return fail("INVALID_PASSWORD", 401);
    const existing = await this.session(req.headers.cookie);
    if (existing && (!presenter || existing.user.role === "presenter"))
      return this.view(existing);
    const token = randomBytes(32).toString("hex");
    const session = await this.db.session.create({
      data: {
        tokenHash: hash(token),
        userId: presenter ? "presenter" : "test",
        expiresAt: new Date(Date.now() + 7 * 86400000),
      },
      include: { user: true },
    });
    res.setHeader(
      "Set-Cookie",
      serialize(sessionCookie, token, {
        httpOnly: true,
        secure: process.env.COOKIE_SECURE === "true",
        sameSite: "lax",
        path: "/",
        maxAge: 7 * 86400,
      }),
    );
    return this.view(session);
  }
  async logout(req: Request, res: Response) {
    const session = await this.session(req.headers.cookie);
    if (session) {
      await this.db.session.update({
        where: { id: session.id },
        data: { expiresAt: new Date() },
      });
      this.sessionEvents.revoke(session.id);
    }
    res.setHeader(
      "Set-Cookie",
      serialize(sessionCookie, "", {
        httpOnly: true,
        path: "/",
        maxAge: 0,
        sameSite: "lax",
        secure: process.env.COOKIE_SECURE === "true",
      }),
    );
    return { ok: true };
  }
}
