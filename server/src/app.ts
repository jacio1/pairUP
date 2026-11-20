import { Module } from "@nestjs/common";
import { AiModule } from "./ai/ai.module";
import { AppController } from "./app.controller";
import { AuthModule } from "./auth/auth.module";
import { ChatModule } from "./chat/chat.module";
import { DatabaseModule } from "./database/database.module";
import { FilesModule } from "./files/files.module";
import { ListingsModule } from "./listings/listings.module";
import { ProfilesModule } from "./profiles/profiles.module";
import { RealtimeModule } from "./realtime/realtime.module";
import { StudyToolsModule } from "./study-tools/study-tools.module";
import { VoiceModule } from "./voice/voice.module";
@Module({
  imports: [
    DatabaseModule,
    AuthModule,
    RealtimeModule,
    AiModule,
    ChatModule,
    ProfilesModule,
    FilesModule,
    StudyToolsModule,
    VoiceModule,
    ListingsModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
