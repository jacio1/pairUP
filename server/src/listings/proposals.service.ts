import { Inject, Injectable } from "@nestjs/common";
import type { SessionView } from "../auth/auth.service";
import { fail } from "../common/api-error";
import { RateLimiter } from "../core";
import { Database } from "../database/database.service";
import { Realtime } from "../realtime/realtime.gateway";
@Injectable()
export class ProposalsService {
  private listingLimiter = new RateLimiter();
  constructor(
    @Inject(Database) private db: Database,
    @Inject(Realtime) private rt: Realtime,
  ) {}
  async proposals(session: SessionView) {
    const rows = await this.db.sessionProposal.findMany({
      where: {
        OR: [
          { senderId: session.id },
          { ownerId: session.id },
          ...(session.role === "presenter"
            ? [{ listingId: "demo-listing" }]
            : []),
        ],
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    const listings = await this.db.listing.findMany({
      where: { id: { in: rows.map((r) => r.listingId) } },
    });
    return rows.map((row) => ({
      ...row,
      incoming: row.senderId !== session.id,
      listing: listings.find((l) => l.id === row.listingId),
    }));
  }
  async propose(session: SessionView, id: string) {
    const listing = await this.db.listing.findUnique({ where: { id } });
    if (!listing) return fail("NOT_FOUND", 404);
    if (
      listing.ownerSessionId === session.id ||
      (id === "demo-listing" && session.role === "presenter")
    )
      return fail("INVALID_INPUT");
    if (!this.listingLimiter.allow(`propose:${session.id}`, 20, 60000))
      return fail("RATE_LIMIT", 429);
    const owner =
      listing.ownerSessionId ??
      (id === "demo-listing"
        ? (
            await this.db.session.findFirst({
              where: { userId: "presenter", expiresAt: { gt: new Date() } },
              orderBy: { createdAt: "desc" },
            })
          )?.id
        : null);
    const proposal = await this.db.sessionProposal.upsert({
      where: { listingId_senderId: { listingId: id, senderId: session.id } },
      create: {
        listingId: id,
        senderId: session.id,
        senderName: session.name,
        ownerId: owner,
      },
      update: {},
    });
    if (owner) this.rt.emit("proposals:changed", {}, `user:${owner}`);
    this.rt.emit("proposals:changed", {}, `user:${session.id}`);
    return proposal;
  }
  async respond(session: SessionView, id: string, body: { accept?: unknown }) {
    if (typeof body?.accept !== "boolean") return fail("INVALID_INPUT");
    const proposal = await this.db.sessionProposal.findUnique({
      where: { id },
    });
    if (!proposal) return fail("NOT_FOUND", 404);
    if (
      proposal.ownerId !== session.id &&
      !(proposal.listingId === "demo-listing" && session.role === "presenter")
    )
      return fail("FORBIDDEN", 403);
    await this.db.sessionProposal.updateMany({
      where: { id, status: "pending" },
      data: { status: body.accept ? "accepted" : "declined" },
    });
    this.rt.emit("proposals:changed", {}, `user:${proposal.senderId}`);
    this.rt.emit("proposals:changed", {}, `user:${session.id}`);
    return { ok: true };
  }
}
