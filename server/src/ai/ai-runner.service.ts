import { Inject, Injectable } from "@nestjs/common";
import { lockChatTransaction } from "../database/chat-lock";
import { Database } from "../database/database.service";
import { Realtime } from "../realtime/realtime.gateway";
import { WorkerBridge } from "../realtime/worker-bridge.service";
import { buildContext } from "./ai-context";
import { CloudProvider } from "./cloud-provider.service";
@Injectable()
export class AiRunner {
  private activeJobs = new Map<string, AbortController>();
  constructor(
    @Inject(Database) private db: Database,
    @Inject(Realtime) private rt: Realtime,
    @Inject(WorkerBridge) private worker: WorkerBridge,
    @Inject(CloudProvider) private cloud: CloudProvider,
  ) {}
  async cancelRoom(roomId: string) {
    const jobs = await this.db.aiJob.findMany({
      where: { roomId, status: "cancelled" },
      select: { id: true },
    });
    for (const { id } of jobs) {
      const controller = this.activeJobs.get(id);
      if (!controller) continue;
      controller.abort();
      this.worker.cancelLocal(id);
    }
  }
  async run(
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
        text = await this.worker.local(id, messages);
      } catch {
        if (controller.signal.aborted) return;
        provider = "cloud";
        text = await this.cloud.complete(messages, controller.signal);
      }
      const message = await this.db.$transaction(async (tx) => {
        await lockChatTransaction(tx);
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
