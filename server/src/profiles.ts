import { Inject, Injectable } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";
import { toolError } from "./study-note";

const publicFields = {
  id: true,
  name: true,
  bio: true,
  interests: true,
  goal: true,
  availability: true,
  avatar: true,
  version: true,
  createdAt: true,
  updatedAt: true,
} as const;
export const profileAuthor = {
  select: { id: true, name: true, avatar: true },
} as const;
export function parseProfile(input: unknown) {
  if (!input || typeof input !== "object") return null;
  const body = input as Record<string, unknown>;
  const fields = ["name", "bio", "interests", "goal", "availability"] as const;
  for (const field of fields)
    if (
      typeof body[field] !== "string" ||
      (body[field] as string).trim().length > (field === "name" ? 60 : 500)
    )
      return null;
  if (
    !(body.name as string).trim() ||
    !["violet", "teal", "peach"].includes(String(body.avatar)) ||
    !Number.isSafeInteger(body.version) ||
    (body.version as number) < 0
  )
    return null;
  return {
    name: (body.name as string).trim(),
    bio: (body.bio as string).trim(),
    interests: (body.interests as string).trim(),
    goal: (body.goal as string).trim(),
    availability: (body.availability as string).trim(),
    avatar: body.avatar as string,
    version: body.version as number,
  };
}
@Injectable()
export class Profiles {
  constructor(@Inject("PROFILE_DATABASE") private db: PrismaClient) {}
  ensure(session: { id: number; user: { role: string } }) {
    return this.db.publicProfile.upsert({
      where: { sessionId: session.id },
      create: {
        sessionId: session.id,
        name:
          session.user.role === "presenter"
            ? "Presenter"
            : `TEST #${session.id}`,
      },
      update: {},
      select: publicFields,
    });
  }
  async get(id: number) {
    if (!Number.isSafeInteger(id) || id < 1) return toolError("NOT_FOUND", 404);
    const profile = await this.db.publicProfile.findUnique({
      where: { id },
      select: {
        ...publicFields,
        _count: { select: { listings: true } },
        listings: {
          orderBy: [{ createdAt: "desc" }, { id: "desc" }],
          take: 100,
          include: { authorProfile: profileAuthor },
        },
      },
    });
    if (!profile) return toolError("NOT_FOUND", 404);
    return profile;
  }
  async save(session: { id: number; user: { role: string } }, input: unknown) {
    const data = parseProfile(input);
    if (!data) return toolError("INVALID_INPUT");
    const profile = await this.ensure(session);
    await this.db.$transaction(async (tx) => {
      const { version, ...fields } = data;
      const updated = await tx.publicProfile.updateMany({
        where: { id: profile.id, sessionId: session.id, version },
        data: { ...fields, version: { increment: 1 } },
      });
      if (!updated.count) return toolError("PROFILE_CONFLICT", 409);
      await tx.listing.updateMany({
        where: { authorProfileId: profile.id },
        data: { authorName: fields.name },
      });
    });
    return this.get(profile.id);
  }
}
