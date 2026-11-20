import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { Realtime } from "./realtime.gateway";
import { WorkerBridge } from "./worker-bridge.service";
@Module({
  imports: [AuthModule],
  providers: [Realtime, WorkerBridge],
  exports: [Realtime, WorkerBridge],
})
export class RealtimeModule {}
