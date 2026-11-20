import { Module } from "@nestjs/common";
import { AiModule } from "../ai/ai.module";
import { AuthModule } from "../auth/auth.module";
import { DatabaseModule } from "../database/database.module";
import { RealtimeModule } from "../realtime/realtime.module";
import { ChatHistory } from "./chat-history.service";
import { ChatController } from "./chat.controller";
import { Chat } from "./chat.service";
@Module({
  imports: [DatabaseModule, AuthModule, RealtimeModule, AiModule],
  controllers: [ChatController],
  providers: [Chat, ChatHistory],
  exports: [Chat],
})
export class ChatModule {}
