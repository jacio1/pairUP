import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  Req,
  Res,
  Injectable,
  Inject,
  Module,
  HttpException,
  OnModuleInit,
  OnModuleDestroy,
} from "@nestjs/common";
import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from "@nestjs/websockets";
import { PrismaClient, Prisma } from "@prisma/client";
import { Server, Socket } from "socket.io";
import { parse, serialize } from "cookie";
import { randomBytes } from "node:crypto";
import type { Request, Response } from "express";
import { parseListing } from "./listings";
import { VoiceService } from "./voice";
import { StudyTools } from "./study-tools";
import { StudyToolsController } from "./study-tools.controller";
import { Profiles, profileAuthor } from "./profiles";
import { ProfilesController } from "./profiles.controller";
import { Files, attachmentFields } from "./files";
import { FilesController, FileRoomGuard } from "./files.controller";
import {
  ROOM,
  hash,
  secretEquals,
  validId,
  validText,
  RateLimiter,
  buildContext,
} from "./core";

const fail = (code: string, status = 400): never => {
  throw new HttpException({ code }, status);
};
const sessionCookie = "PAIRUP_SESSION";
const allowedOrigins = () =>
  (process.env.PUBLIC_ORIGIN || "http://localhost:3000").split(",");

@Injectable()
export class Database
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  async onModuleInit() {
    await this.$connect();
    await this.user.upsert({
      where: { id: "test" },
      create: { id: "test", role: "guest" },
      update: {},
    });
    await this.user.upsert({
      where: { id: "presenter" },
      create: { id: "presenter", role: "presenter" },
      update: {},
    });
    await this.room.upsert({
      where: { id: ROOM },
      create: { id: ROOM },
      update: {},
    });
    await this.room.upsert({
      where: { id: "listing-english-practice" },
      create: { id: "listing-english-practice" },
      update: {},
    });
    await this.listing.upsert({
      where: { id: "demo-listing" },
      create: { id: "demo-listing", roomId: "listing-english-practice" },
      update: { roomId: "listing-english-practice" },
    });
    const alex = await this.publicProfile.upsert({
      where: { seedKey: "english-author" },
      create: { seedKey: "english-author", name: "Alex" },
      update: {},
    });
    await this.listing.updateMany({
      where: { id: "demo-listing" },
      data: {
        authorName: "Alex",
        authorProfileId: alex.id,
        title: "English",
        subject: "english",
        level: "intermediate",
        goal: "Build confidence speaking English",
        description: "English",
        schedule: "",
      },
    });
    await this.aiJob.updateMany({
      where: { status: { in: ["pending", "running"] } },
      data: { status: "failed", error: "AI_INTERRUPTED" },
    });
  }
  async onModuleDestroy() {
    await this.$disconnect();
  }
}

@Injectable()
export class Auth {
  limiter = new RateLimiter();
  constructor(@Inject(Database) private db: Database) {}
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
  view(session: NonNullable<Awaited<ReturnType<Auth["session"]>>>) {
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
}

@WebSocketGateway({
  maxHttpBufferSize: 16384,
  cors: { origin: allowedOrigins(), credentials: true },
})
export class Realtime implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server!: Server;
  private worker?: Socket;
  private pending = new Map<
    string,
    {
      socketId: string;
      resolve: (text: string) => void;
      reject: (e: Error) => void;
      timer: NodeJS.Timeout;
    }
  >();
  onMessage?: (socket: Socket, payload: unknown) => Promise<unknown>;
  constructor(@Inject(Auth) private auth: Auth) {}
  async handleConnection(socket: Socket) {
    try {
      const origin = socket.handshake.headers.origin;
      if (origin && !allowedOrigins().includes(origin))
        return socket.disconnect(true);
      if (socket.handshake.auth?.kind === "worker") {
        const secret = socket.handshake.auth.secret;
        if (
          typeof secret !== "string" ||
          !secretEquals(secret, process.env.WORKER_SECRET!) ||
          this.worker?.connected
        )
          return socket.disconnect(true);
        this.worker = socket;
        socket.on("worker:result", (data) => {
          const pending = data && this.pending.get(data.id);
          if (!pending || pending.socketId !== socket.id) return;
          clearTimeout(pending.timer);
          this.pending.delete(data.id);
          if (validText(data.text, 16000)) pending.resolve(data.text.trim());
          else pending.reject(new Error("LOCAL_ERROR"));
        });
        socket.emit("worker:ready");
        return;
      }
      const session = await this.auth.require(socket.handshake.headers.cookie);
      socket.data.session = this.auth.view(session);
      await socket.join(`user:${session.id}`);
      const requestedRoom = socket.handshake.auth?.roomId;
      if (typeof requestedRoom === "string") {
        try {
          await this.auth.roomAccess(
            socket.handshake.headers.cookie,
            requestedRoom,
          );
          socket.data.roomId = requestedRoom;
          await socket.join(requestedRoom);
        } catch {
          socket.emit("room:denied");
        }
      }
      socket.data.expiry = setTimeout(
        () => {
          socket.emit("session:expired");
          socket.disconnect(true);
        },
        Math.max(0, session.expiresAt.getTime() - Date.now()),
      );
      socket.on("message:send", async (payload, ack) => {
        if (typeof ack !== "function") return;
        try {
          ack({ ok: true, message: await this.onMessage?.(socket, payload) });
        } catch (error) {
          ack({
            ok: false,
            code:
              error instanceof HttpException
                ? (error.getResponse() as { code: string }).code
                : "SERVER_ERROR",
          });
        }
      });
      socket.emit("room:ready");
    } catch {
      socket.emit("session:expired");
      socket.disconnect(true);
    }
  }
  handleDisconnect(socket: Socket) {
    clearTimeout(socket.data.expiry);
    if (this.worker?.id === socket.id) this.worker = undefined;
    for (const [id, pending] of this.pending)
      if (pending.socketId === socket.id) {
        clearTimeout(pending.timer);
        pending.reject(new Error("LOCAL_OFFLINE"));
        this.pending.delete(id);
      }
  }
  emit(event: string, data: unknown, roomId = ROOM) {
    this.server
      .to(roomId)
      .emit(
        event,
        data && typeof data === "object" ? { ...data, roomId } : data,
      );
  }
  cancelLocal(id: string) {
    const pending = this.pending.get(id);
    if (!pending) return;
    clearTimeout(pending.timer);
    this.pending.delete(id);
    this.worker?.emit("worker:cancel", { id });
    pending.reject(new Error("LOCAL_CANCELLED"));
  }
  local(id: string, messages: ReturnType<typeof buildContext>) {
    return new Promise<string>((resolve, reject) => {
      if (!this.worker?.connected) return reject(new Error("LOCAL_OFFLINE"));
      const timer = setTimeout(
        () => {
          this.pending.delete(id);
          this.worker?.emit("worker:cancel", { id });
          reject(new Error("LOCAL_TIMEOUT"));
        },
        Number(process.env.LOCAL_TIMEOUT_MS || 45000),
      );
      this.pending.set(id, {
        socketId: this.worker.id,
        resolve,
        reject,
        timer,
      });
      this.worker.emit("worker:job", { id, messages });
    });
  }
}

@Injectable()
export class Chat implements OnModuleInit {
  private limiter = new RateLimiter();
  private activeJobs = new Map<string, AbortController>();
  constructor(
    @Inject(Database) private db: Database,
    @Inject(Auth) private auth: Auth,
    @Inject(Realtime) private rt: Realtime,
  ) {}
  onModuleInit() {
    this.rt.onMessage = async (socket, payload) => {
      const roomId = socket.data.roomId;
      if (!roomId) return fail("FORBIDDEN", 403);
      const session = await this.auth.roomAccess(
        socket.handshake.headers.cookie,
        roomId,
      );
      return this.send(this.auth.view(session), payload, roomId);
    };
  }
  async lock(tx: Prisma.TransactionClient) {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(735901)`;
  }
  async snapshot(after = 0, roomId = ROOM) {
    if (!Number.isSafeInteger(after) || after < 0) return fail("INVALID_INPUT");
    return this.db.$transaction(async (tx) => {
      await this.lock(tx);
      const room = await tx.room.findUniqueOrThrow({ where: { id: roomId } });
      const messages = await tx.message.findMany({
        include: { attachment: { select: attachmentFields } },
        where: { roomId: roomId, seq: { gt: after } },
        orderBy: { seq: "asc" },
        take: 500,
      });
      const job = await tx.aiJob.findFirst({
        where: { roomId: roomId, generation: room.generation },
        orderBy: { createdAt: "desc" },
      });
      return {
        messages: messages.map((message) => ({
          ...message,
          generation: room.generation,
        })),
        generation: room.generation,
        hasMore: messages.length === 500,
        ai: job
          ? {
              id: job.id,
              status: job.status,
              error: job.error,
              generation: room.generation,
            }
          : null,
      };
    });
  }
  async send(
    session: { id: number; name: string },
    raw: unknown,
    roomId = ROOM,
  ) {
    const data = raw as { clientRequestId?: unknown; text?: unknown };
    if (!data || !validId(data.clientRequestId) || !validText(data.text, 1000))
      return fail("INVALID_INPUT");
    const requestId = `message:${roomId}:${session.id}:${data.clientRequestId}`;
    const result = await this.db.$transaction(async (tx) => {
      await this.lock(tx);
      const room = await tx.room.findUniqueOrThrow({ where: { id: roomId } });
      const existing = await tx.message.findUnique({
        where: { clientRequestId: requestId },
      });
      if (existing)
        return {
          message: { ...existing, generation: room.generation },
          created: false,
        };
      if (!this.limiter.allow(`send:${session.id}`, 5, 10000))
        return fail("RATE_LIMIT", 429);
      return {
        message: await tx.message.create({
          data: {
            roomId: roomId,
            author: session.name,
            sessionId: session.id,
            text: (data.text as string).trim(),
            clientRequestId: requestId,
          },
        }),
        created: true,
        generation: room.generation,
      };
    });
    const message = {
      ...result.message,
      generation: result.generation ?? result.message.generation,
    };
    if (result.created) this.rt.emit("message:created", message, roomId);
    return message;
  }
  async reset(roomId = ROOM) {
    const room = await this.db.$transaction(async (tx) => {
      await this.lock(tx);
      await tx.message.deleteMany({ where: { roomId: roomId } });
      await tx.aiJob.updateMany({
        where: { roomId: roomId, status: { in: ["pending", "running"] } },
        data: { status: "cancelled" },
      });
      return tx.room.update({
        where: { id: roomId },
        data: { generation: { increment: 1 } },
      });
    });
    const jobs = await this.db.aiJob.findMany({
      where: { roomId, status: "cancelled" },
      select: { id: true },
    });
    for (const { id } of jobs) {
      const controller = this.activeJobs.get(id);
      if (!controller) continue;
      controller.abort();
      this.rt.cancelLocal(id);
    }
    this.rt.emit("room:reset", { generation: room.generation }, roomId);
    return { ok: true };
  }
  async requestAi(
    session: { id: number; name: string },
    data: {
      clientRequestId?: unknown;
      prompt?: unknown;
      locale?: unknown;
      targetMessageId?: unknown;
    },
    roomId = ROOM,
  ) {
    if (
      !data ||
      !validId(data.clientRequestId) ||
      !validText(data.prompt, 2000) ||
      !["en", "ru"].includes(data.locale as string) ||
      (data.targetMessageId !== undefined && !validId(data.targetMessageId))
    )
      return fail("INVALID_INPUT");
    const requestId = `ai:${roomId}:${session.id}:${data.clientRequestId}`;
    const result = await this.db.$transaction(async (tx) => {
      await this.lock(tx);
      const existing = await tx.aiJob.findUnique({
        where: { clientRequestId: requestId },
      });
      if (existing) return { job: existing, messages: null, message: null };
      const room = await tx.room.findUniqueOrThrow({ where: { id: roomId } });
      const latest = await tx.aiJob.findFirst({
        where: { roomId: roomId, generation: room.generation },
        orderBy: { createdAt: "desc" },
      });
      if (
        latest &&
        (["pending", "running"].includes(latest.status) ||
          Date.now() - latest.createdAt.getTime() < 15000)
      )
        return fail("AI_BUSY", 429);
      const target = data.targetMessageId
        ? await tx.message.findFirst({
            where: { id: data.targetMessageId as string, roomId: roomId },
          })
        : null;
      if (data.targetMessageId && !target)
        return fail("MESSAGE_NOT_FOUND", 404);
      const rows = await tx.message.findMany({
        where: {
          roomId: roomId,
          kind: "human",
          ...(target ? { seq: { lte: target.seq } } : {}),
        },
        orderBy: { seq: "desc" },
        take: target ? 11 : 20,
      });
      const priorPairs = await tx.message.findMany({
        where: {
          roomId: roomId,
          kind: { in: ["ai-request", "ai"] },
          ...(target ? { seq: { lte: target.seq } } : {}),
        },
        orderBy: { seq: "desc" },
        take: 8,
      });
      const paired = priorPairs
        .filter((m) => m.kind === "ai")
        .slice(0, 2)
        .flatMap((answer) => {
          const request = priorPairs.find(
            (m) => m.id === answer.targetMessageId && m.kind === "ai-request",
          );
          return request ? [request, answer] : [];
        });
      const context = [...rows, ...paired].sort((a, b) => a.seq - b.seq);
      // Ensure the selected message is present even when it is an AI response.
      if (target && !context.some((m) => m.id === target.id))
        context.push(target);
      const job = await tx.aiJob.create({
        data: {
          roomId: roomId,
          clientRequestId: requestId,
          prompt: (data.prompt as string).trim(),
          locale: data.locale as string,
          targetMessageId: target?.id,
          generation: room.generation,
          status: "running",
        },
      });
      const message = await tx.message.create({
        data: {
          roomId: roomId,
          author: session.name,
          sessionId: session.id,
          kind: "ai-request",
          text: job.prompt,
          clientRequestId: `job-request:${job.id}`,
          targetMessageId: target?.id,
        },
      });
      return {
        job,
        messages: buildContext(context, job.prompt, job.locale),
        message,
      };
    });
    if (result.messages) {
      this.rt.emit(
        "message:created",
        {
          ...result.message,
          generation: result.job.generation,
        },
        roomId,
      );
      this.rt.emit(
        "ai:status",
        {
          id: result.job.id,
          status: "running",
          generation: result.job.generation,
        },
        roomId,
      );
      void this.runAi(
        result.job.id,
        result.job.generation,
        result.messages,
        result.message!.id,
        roomId,
      );
    }
    return {
      roomId,
      id: result.job.id,
      status: result.job.status,
      generation: result.job.generation,
    };
  }
  private async cloud(
    messages: ReturnType<typeof buildContext>,
    signal: AbortSignal,
  ) {
    if (!process.env.YANDEX_API_KEY || !process.env.YANDEX_MODEL)
      throw new Error("CLOUD_NOT_CONFIGURED");
    const response = await fetch(
      process.env.YANDEX_API_URL ||
        "https://ai.api.cloud.yandex.net/v1/chat/completions",
      {
        method: "POST",
        signal: AbortSignal.any([signal, AbortSignal.timeout(45000)]),
        headers: {
          "Content-Type": "application/json",
          Authorization: `Api-Key ${process.env.YANDEX_API_KEY}`,
        },
        body: JSON.stringify({
          model: process.env.YANDEX_MODEL,
          messages,
          temperature: 0.3,
          max_tokens: 1024,
          stream: false,
        }),
      },
    );
    if (!response.ok) throw new Error("CLOUD_ERROR");
    const body = (await response.json()) as {
      choices?: { message?: { content?: unknown } }[];
    };
    const text = body.choices?.[0]?.message?.content;
    if (!validText(text, 16000)) throw new Error("CLOUD_ERROR");
    return text;
  }
  private async runAi(
    id: string,
    generation: number,
    messages: ReturnType<typeof buildContext>,
    requestMessageId: string,
    roomId: string,
  ) {
    const controller = new AbortController();
    this.activeJobs.set(id, controller);
    try {
      let text: string;
      let provider = "local";
      try {
        text = await this.rt.local(id, messages);
      } catch {
        if (controller.signal.aborted) return;
        provider = "cloud";
        text = await this.cloud(messages, controller.signal);
      }
      const message = await this.db.$transaction(async (tx) => {
        await this.lock(tx);
        const room = await tx.room.findUniqueOrThrow({ where: { id: roomId } });
        const job = await tx.aiJob.findUniqueOrThrow({ where: { id } });
        if (room.generation !== generation || job.status !== "running")
          return null;
        const message = await tx.message.create({
          data: {
            roomId: roomId,
            author: "Neuron",
            kind: "ai",
            text,
            clientRequestId: `job-answer:${id}`,
            targetMessageId: requestMessageId,
          },
        });
        await tx.aiJob.update({
          where: { id },
          data: { status: "completed", provider },
        });
        return message;
      });
      if (message) {
        this.rt.emit("message:created", { ...message, generation }, roomId);
        this.rt.emit(
          "ai:status",
          { id, status: "completed", generation },
          roomId,
        );
      }
    } catch {
      const result = await this.db.aiJob.updateMany({
        where: { id, status: "running" },
        data: { status: "failed", error: "AI_UNAVAILABLE" },
      });
      if (result.count)
        this.rt.emit(
          "ai:status",
          {
            id,
            status: "failed",
            error: "AI_UNAVAILABLE",
            generation,
          },
          roomId,
        );
    } finally {
      this.activeJobs.delete(id);
    }
  }
}

@Controller("api")
export class Api {
  private listingLimiter = new RateLimiter();
  private voiceLimiter = new RateLimiter();
  constructor(
    @Inject(Auth) private auth: Auth,
    @Inject(Chat) private chat: Chat,
    @Inject(Database) private db: Database,
    @Inject(Realtime) private rt: Realtime,
    @Inject(VoiceService) private voice: VoiceService,
    @Inject(Profiles) private profiles: Profiles,
  ) {}
  @Get("health") async health() {
    await this.db.$queryRaw`SELECT 1`;
    return { ok: true };
  }
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
  @Get("listings") async listings(
    @Req() req: Request,
    @Query("mine") mine?: string,
  ) {
    const owner =
      mine === "true" ? await this.auth.require(req.headers.cookie) : null;
    return this.db.listing.findMany({
      include: { authorProfile: profileAuthor },
      where: {
        ...(owner ? { ownerSessionId: owner.id } : {}),
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: 100,
    });
  }
  @Post("listings") async createListing(
    @Req() req: Request,
    @Body() body: unknown,
  ) {
    const session = await this.auth.require(req.headers.cookie);
    const listing = parseListing(body);
    if (!listing) return fail("INVALID_INPUT");
    const existing = await this.db.listing.findUnique({
      where: { id: listing.id },
    });
    if (existing) {
      if (existing.ownerSessionId !== session.id) return fail("FORBIDDEN", 403);
      return existing;
    }
    if (!this.listingLimiter.allow(`listing:${session.id}`, 10, 3600000))
      return fail("RATE_LIMIT", 429);
    let created;
    const profile = await this.profiles.ensure(session);
    try {
      created = await this.db.listing.create({
        data: {
          ...listing,
          authorName: profile.name,
          authorProfile: { connect: { id: profile.id } },
          owner: { connect: { id: session.id } },
          room: { create: { id: `listing-${listing.id}` } },
        },
      });
    } catch (error) {
      // A concurrent retry can reach create before the first publication commits.
      if (
        !(error instanceof Prisma.PrismaClientKnownRequestError) ||
        error.code !== "P2002"
      )
        throw error;
      created = await this.db.listing.findUniqueOrThrow({
        where: { id: listing.id },
      });
    }
    if (created.ownerSessionId !== session.id) return fail("FORBIDDEN", 403);
    return created;
  }
  @Post("auth/logout") async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const session = await this.auth.session(req.headers.cookie);
    if (session) {
      await this.db.session.update({
        where: { id: session.id },
        data: { expiresAt: new Date() },
      });
      this.rt.server.in(`user:${session.id}`).disconnectSockets(true);
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
  @Get("proposals") async proposals(@Req() req: Request) {
    const session = await this.auth.require(req.headers.cookie);
    const rows = await this.db.sessionProposal.findMany({
      where: {
        OR: [
          { senderId: session.id },
          { ownerId: session.id },
          ...(session.user.role === "presenter"
            ? [{ listingId: "demo-listing" }]
            : []),
        ],
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    const listings = await this.db.listing.findMany({
      where: { id: { in: rows.map((r) => r.listingId) } },
    });
    return rows.map((row) => ({
      ...row,
      incoming: row.senderId !== session.id,
      listing: listings.find((l) => l.id === row.listingId),
    }));
  }
  @Post("listings/:id/proposals") async propose(
    @Req() req: Request,
    @Param("id") id: string,
  ) {
    const session = await this.auth.require(req.headers.cookie);
    const listing = await this.db.listing.findUnique({ where: { id } });
    if (!listing) return fail("NOT_FOUND", 404);
    if (
      listing.ownerSessionId === session.id ||
      (id === "demo-listing" && session.user.role === "presenter")
    )
      return fail("INVALID_INPUT");
    if (!this.listingLimiter.allow(`propose:${session.id}`, 20, 60000))
      return fail("RATE_LIMIT", 429);
    const owner =
      listing.ownerSessionId ??
      (id === "demo-listing"
        ? (
            await this.db.session.findFirst({
              where: { userId: "presenter", expiresAt: { gt: new Date() } },
              orderBy: { createdAt: "desc" },
            })
          )?.id
        : null);
    const proposal = await this.db.sessionProposal.upsert({
      where: { listingId_senderId: { listingId: id, senderId: session.id } },
      create: {
        listingId: id,
        senderId: session.id,
        senderName: this.auth.view(session).name,
        ownerId: owner,
      },
      update: {},
    });
    if (owner) this.rt.emit("proposals:changed", {}, `user:${owner}`);
    this.rt.emit("proposals:changed", {}, `user:${session.id}`);
    return proposal;
  }
  @Post("proposals/:id/respond") async respond(
    @Req() req: Request,
    @Param("id") id: string,
    @Body() body: { accept?: unknown },
  ) {
    const session = await this.auth.require(req.headers.cookie);
    if (typeof body?.accept !== "boolean") return fail("INVALID_INPUT");
    const proposal = await this.db.sessionProposal.findUnique({
      where: { id },
    });
    if (!proposal) return fail("NOT_FOUND", 404);
    if (
      proposal.ownerId !== session.id &&
      !(
        proposal.listingId === "demo-listing" &&
        session.user.role === "presenter"
      )
    )
      return fail("FORBIDDEN", 403);
    await this.db.sessionProposal.updateMany({
      where: { id, status: "pending" },
      data: { status: body.accept ? "accepted" : "declined" },
    });
    this.rt.emit("proposals:changed", {}, `user:${proposal.senderId}`);
    this.rt.emit("proposals:changed", {}, `user:${session.id}`);
    return { ok: true };
  }
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
  @Get("rooms/:id/messages") async messages(
    @Req() req: Request,
    @Param("id") id: string,
    @Query("after") after?: string,
  ) {
    await this.auth.roomAccess(req.headers.cookie, id);
    return this.chat.snapshot(after ? Number(after) : 0, id);
  }
  @Post("rooms/:id/ai/requests") async ai(
    @Req() req: Request,
    @Param("id") id: string,
    @Body() body: Parameters<Chat["requestAi"]>[1],
  ) {
    await this.auth.roomAccess(req.headers.cookie, id);
    const session = await this.auth.require(req.headers.cookie, true);
    return this.chat.requestAi(this.auth.view(session), body, id);
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

@Module({
  controllers: [Api, StudyToolsController, ProfilesController, FilesController],
  providers: [
    Database,
    Auth,
    Realtime,
    Chat,
    VoiceService,
    StudyTools,
    Profiles,
    Files,
    FileRoomGuard,
    { provide: "FILES_DATABASE", useExisting: Database },
    { provide: "FILES_ACCESS", useExisting: Auth },
    { provide: "FILES_REALTIME", useExisting: Realtime },
    { provide: "PROFILE_DATABASE", useExisting: Database },
    { provide: "PROFILE_ACCESS", useExisting: Auth },
    { provide: "STUDY_DATABASE", useExisting: Database },
    { provide: "STUDY_ACCESS", useExisting: Auth },
    { provide: "STUDY_REALTIME", useExisting: Realtime },
  ],
})
export class AppModule {}
