import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { DatabaseModule } from "../database/database.module";
import { ProfilesController } from "./profiles.controller";
import { Profiles } from "./profiles.service";
@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [ProfilesController],
  providers: [Profiles],
  exports: [Profiles],
})
export class ProfilesModule {}
