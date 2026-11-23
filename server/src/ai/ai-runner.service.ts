import { randomUUID } from "node:crypto";
import { HttpException, Inject, Injectable } from "@nestjs/common";
import { lockChatTransaction } from "../database/chat-lock";
import { Database } from "../database/database.service";
import { Realtime } from "../realtime/realtime.gateway";
import { WorkerBridge } from "../realtime/worker-bridge.service";
import { RoomActivities } from "../study-tools/room-activities.service";
import { StudyTools } from "../study-tools/study-tools.service";
import { buildContext } from "./ai-context";
import { newNoteState, parseToolResponse } from "./ai-tools";
import { CloudProvider } from "./cloud-provider.service";
@Injectable()
export class AiRunner {
  private activeJobs = new Map<string, AbortController>();
  constructor(
    @Inject(Database) private db: Database,
    @Inject(Realtime) private rt: Realtime,
    @Inject(WorkerBridge) private worker: WorkerBridge,
    @Inject(CloudProvider) private cloud: CloudProvider,
    @Inject(StudyTools) private tools: StudyTools,
    @Inject(RoomActivities) private activities: RoomActivities,
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
      let actions: ReturnType<typeof parseToolResponse> = null;
      let rejected = false;
      try {
        actions = parseToolResponse(text);
      } catch {
        rejected = true;
      }
      const failureText = {
        ru: "Не удалось выполнить действия в рабочих инструментах.",
        en: "Could not apply the changes to the session tools.",
      };
      const persist = () => this.db.$transaction(async (tx) => {
        await lockChatTransaction(tx);
        const room = await tx.room.findUniqueOrThrow({ where: { id: roomId } });
        const job = await tx.aiJob.findUniqueOrThrow({ where: { id } });
        if (room.generation !== generation || job.status !== "running")
          return null;
        const ru = job.locale === "ru";
        const confirmations: string[] = [];
        for (const action of actions ?? []) {
          switch (action.type) {
            case "create_task": {
              const task = await this.tools.createTask(
                roomId,
                { id: randomUUID(), title: action.title },
                tx,
              );
              confirmations.push(
                ru ? `Добавлена задача «${task.title}».` : `Created task “${task.title}”.`,
              );
              break;
            }
            case "create_note": {
              const note = await this.tools.createNote(
                roomId,
                { id: randomUUID() },
                { tx, state: newNoteState(action.title, action.body) },
              );
              confirmations.push(
                ru ? `Добавлена заметка «${note.title}».` : `Created note “${note.title}”.`,
              );
              break;
            }
            case "timer": {
              await this.activities.updateTimer(roomId, { action: action.action }, tx);
              const status = {
                start: ru ? "Таймер запущен." : "Started the timer.",
                pause: ru ? "Таймер на паузе." : "Paused the timer.",
                reset: ru ? "Таймер сброшен." : "Reset the timer.",
              };
              confirmations.push(status[action.action]);
              break;
            }
          }
        }
        const message = await tx.message.create({
          data: {
            roomId: roomId,
            author: "Neuron",
            kind: "ai",
            text: rejected
              ? failureText[ru ? "ru" : "en"]
              : confirmations.join("\n") || text,
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
      const message = await persist().catch((error: unknown) => {
        if (!actions || !(error instanceof HttpException)) throw error;
        // The first transaction rolled back the entire batch.
        actions = null;
        rejected = true;
        return persist();
      });
      if (message) {
        if (actions) this.rt.emit("tools:changed", {}, roomId);
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
