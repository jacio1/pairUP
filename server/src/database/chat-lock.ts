import type { Prisma } from "@prisma/client";
export async function lockChatTransaction(tx: Prisma.TransactionClient) {
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(735901)`;
}
