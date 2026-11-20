import {
  HttpException,
  Inject,
  OnModuleDestroy,
  OnModuleInit,
} from "@nestjs/common";
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { AuthSessionEvents } from "../auth/auth-session.events";
import { AuthService } from "../auth/auth.service";
import { allowedOrigins } from "../config/origins";
import { ROOM, secretEquals } from "../core";
import { WorkerBridge } from "./worker-bridge.service";

@WebSocketGateway({
  maxHttpBufferSize: 16384,
  cors: { origin: allowedOrigins(), credentials: true },
})
export class Realtime
  implements
    OnGatewayConnection,
    OnGatewayDisconnect,
    OnModuleInit,
    OnModuleDestroy
{
  @WebSocketServer() server!: Server;
  private onMessage?: (socket: Socket, payload: unknown) => Promise<unknown>;
  registerMessageHandler(
    handler: (socket: Socket, payload: unknown) => Promise<unknown>,
  ) {
    this.onMessage = handler;
    return () => {
      if (this.onMessage === handler) this.onMessage = undefined;
    };
  }
  private stopSessionListener?: () => void;
  constructor(
    @Inject(AuthService) private auth: AuthService,
    @Inject(WorkerBridge) private workerBridge: WorkerBridge,
    @Inject(AuthSessionEvents) private sessionEvents: AuthSessionEvents,
  ) {}
  onModuleInit() {
    this.stopSessionListener = this.sessionEvents.onRevoked((id) => {
      this.server.in(`user:${id}`).disconnectSockets(true);
    });
  }
  onModuleDestroy() {
    this.stopSessionListener?.();
  }
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
          this.workerBridge.connected
        )
          return socket.disconnect(true);
        this.workerBridge.connect(socket);
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
    this.workerBridge.disconnect(socket);
  }
  emit(event: string, data: unknown, roomId = ROOM) {
    this.server
      .to(roomId)
      .emit(
        event,
        data && typeof data === "object" ? { ...data, roomId } : data,
      );
  }
}
