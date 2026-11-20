import { Module } from "@nestjs/common";
import { DatabaseModule } from "../database/database.module";
import { AuthSessionEvents } from "./auth-session.events";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";

@Module({
  imports: [DatabaseModule],
  controllers: [AuthController],
  providers: [AuthService, AuthSessionEvents],
  exports: [AuthService, AuthSessionEvents],
})
export class AuthModule {}
