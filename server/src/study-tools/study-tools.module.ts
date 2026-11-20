import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { DatabaseModule } from "../database/database.module";
import { RealtimeModule } from "../realtime/realtime.module";
import { RoomActivities } from "./room-activities.service";
import { StudyToolsController } from "./study-tools.controller";
import { StudyTools } from "./study-tools.service";
@Module({
  imports: [DatabaseModule, AuthModule, RealtimeModule],
  controllers: [StudyToolsController],
  providers: [StudyTools, RoomActivities],
})
export class StudyToolsModule {}
