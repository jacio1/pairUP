import type { Socket } from "socket.io-client";
import type { Message } from "./chat-types";
type Delivery = { ok: boolean; code?: string; message?: Message };
let activeSocket: Socket | null = null;
export function bindChatSocket(socket: Socket) {
  activeSocket = socket;
  return () => {
    if (activeSocket === socket) activeSocket = null;
  };
}
export function sendChatMessage(
  payload: { text: string; clientRequestId: string; targetMessageId?: string },
  acknowledge: (error: Error | null, response?: Delivery) => void,
) {
  if (!activeSocket?.connected) {
    acknowledge(new Error("DISCONNECTED"));
    return;
  }
  activeSocket.timeout(8000).emit("message:send", payload, acknowledge);
}
