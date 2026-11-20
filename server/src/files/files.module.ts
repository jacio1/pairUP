import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { DatabaseModule } from "../database/database.module";
import { RealtimeModule } from "../realtime/realtime.module";
import { FileRoomGuard, FilesController } from "./files.controller";
import { Files } from "./files.service";
@Module({
  imports: [DatabaseModule, AuthModule, RealtimeModule],
  controllers: [FilesController],
  providers: [Files, FileRoomGuard],
})
export class FilesModule {}
