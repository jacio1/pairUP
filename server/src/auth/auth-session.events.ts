import { Injectable } from "@nestjs/common";
import { EventEmitter } from "node:events";

@Injectable()
export class AuthSessionEvents {
  private readonly events = new EventEmitter();

  onRevoked(listener: (sessionId: number) => void): () => void {
    this.events.on("revoked", listener);
    return () => {
      this.events.off("revoked", listener);
    };
  }

  revoke(sessionId: number): void {
    this.events.emit("revoked", sessionId);
  }
}
