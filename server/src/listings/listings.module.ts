import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { DatabaseModule } from "../database/database.module";
import { ProfilesModule } from "../profiles/profiles.module";
import { RealtimeModule } from "../realtime/realtime.module";
import { ListingsController } from "./listings.controller";
import { ListingsService } from "./listings.service";
import { ProposalsService } from "./proposals.service";
@Module({
  imports: [DatabaseModule, AuthModule, ProfilesModule, RealtimeModule],
  controllers: [ListingsController],
  providers: [ListingsService, ProposalsService],
})
export class ListingsModule {}
