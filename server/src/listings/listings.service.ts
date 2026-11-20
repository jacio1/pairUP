import { Inject, Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import type { AuthSession } from "../auth/auth.service";
import { fail } from "../common/api-error";
import { RateLimiter } from "../core";
import { Database } from "../database/database.service";
import { profileAuthor, Profiles } from "../profiles/profiles.service";
import { parseListing } from "./listing.validation";
const listingSocial = {
  include: { media: { orderBy: { position: "asc" as const } } },
};
@Injectable()
export class ListingsService {
  private listingLimiter = new RateLimiter();
  constructor(
    @Inject(Database) private db: Database,
    @Inject(Profiles) private profiles: Profiles,
  ) {}
  async listings(ownerSessionId?: number) {
    return this.db.listing.findMany({
      include: { authorProfile: profileAuthor },
      where: {
        ...(ownerSessionId !== undefined ? { ownerSessionId } : {}),
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: 100,
    });
  }
  async createListing(
    session: AuthSession,
    body: unknown,
    media: {
      id: string;
      name: string;
      mime: string;
      kind: string;
      position: number;
    }[] = [],
  ) {
    const listing = parseListing(body);
    if (!listing) return fail("INVALID_INPUT");
    const existing = await this.db.listing.findUnique({
      where: { id: listing.id },
      include: { socialPost: listingSocial },
    });
    if (existing) {
      if (existing.ownerSessionId !== session.id) return fail("FORBIDDEN", 403);
      return existing;
    }
    if (!this.listingLimiter.allow(`listing:${session.id}`, 10, 3600000))
      return fail("RATE_LIMIT", 429);
    let created;
    const profile = await this.profiles.ensure(session);
    try {
      created = await this.db.listing.create({
        include: { socialPost: listingSocial },
        data: {
          ...listing,
          socialPost: {
            create: { id: `listing-${listing.id}`, media: { create: media } },
          },
          authorName: profile.name,
          authorProfile: { connect: { id: profile.id } },
          owner: { connect: { id: session.id } },
          room: { create: { id: `listing-${listing.id}` } },
        },
      });
    } catch (error) {
      // A concurrent retry can reach create before the first publication commits.
      if (
        !(error instanceof Prisma.PrismaClientKnownRequestError) ||
        error.code !== "P2002"
      )
        throw error;
      created = await this.db.listing.findUniqueOrThrow({
        where: { id: listing.id },
        include: { socialPost: listingSocial },
      });
    }
    if (created.ownerSessionId !== session.id) return fail("FORBIDDEN", 403);
    return created;
  }
}
