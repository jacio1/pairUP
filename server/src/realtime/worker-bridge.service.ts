import { Injectable } from "@nestjs/common";
import type { Socket } from "socket.io";
import { buildContext } from "../ai/ai-context";
import { validText } from "../core";

@Injectable()
export class WorkerBridge {
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
  get connected() {
    return !!this.worker?.connected;
  }
  connect(socket: Socket) {
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
  }
  disconnect(socket: Socket) {
    if (this.worker?.id === socket.id) this.worker = undefined;
    for (const [id, pending] of this.pending)
      if (pending.socketId === socket.id) {
        clearTimeout(pending.timer);
        pending.reject(new Error("LOCAL_OFFLINE"));
        this.pending.delete(id);
      }
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
