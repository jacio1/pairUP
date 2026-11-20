import { Controller, Get, Inject } from "@nestjs/common";
import { Database } from "./database/database.service";
@Controller("api")
export class AppController {
  constructor(@Inject(Database) private db: Database) {}
  @Get("health") async health() {
    await this.db.$queryRaw`SELECT 1`;
    return { ok: true };
  }
}
