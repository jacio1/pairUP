import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { DatabaseModule } from "../database/database.module";
import { RealtimeModule } from "../realtime/realtime.module";
import { AiRunner } from "./ai-runner.service";
import { AiController } from "./ai.controller";
import { AiService } from "./ai.service";
import { CloudProvider } from "./cloud-provider.service";
@Module({
  imports: [DatabaseModule, AuthModule, RealtimeModule],
  controllers: [AiController],
  providers: [AiService, AiRunner, CloudProvider],
  exports: [AiService, AiRunner],
})
export class AiModule {}
