import { Injectable, OnModuleInit, OnModuleDestroy } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";
import { ROOM } from "../core";

@Injectable()
export class Database
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  async onModuleInit() {
    await this.$connect();
    await this.user.upsert({
      where: { id: "test" },
      create: { id: "test", role: "guest" },
      update: {},
    });
    await this.user.upsert({
      where: { id: "presenter" },
      create: { id: "presenter", role: "presenter" },
      update: {},
    });
    await this.room.upsert({
      where: { id: ROOM },
      create: { id: ROOM },
      update: {},
    });
    await this.room.upsert({
      where: { id: "listing-english-practice" },
      create: { id: "listing-english-practice" },
      update: {},
    });
    await this.listing.upsert({
      where: { id: "demo-listing" },
      create: { id: "demo-listing", roomId: "listing-english-practice" },
      update: { roomId: "listing-english-practice" },
    });
    const englishAuthor = await this.publicProfile.upsert({
      where: { seedKey: "english-author" },
      create: { seedKey: "english-author", name: "EnglishVUZ" },
      update: { name: "EnglishVUZ" },
    });
    await this.listing.updateMany({
      where: { id: "demo-listing" },
      data: {
        authorName: "EnglishVUZ",
        authorProfileId: englishAuthor.id,
        title: "English",
        subject: "english",
        level: "intermediate",
        goal: "Build confidence speaking English",
        description: "English",
        schedule: "",
      },
    });
    await this.aiJob.updateMany({
      where: { status: { in: ["pending", "running"] } },
      data: { status: "failed", error: "AI_INTERRUPTED" },
    });
  }
  async onModuleDestroy() {
    await this.$disconnect();
  }
}
