CREATE TABLE "SessionProposal" (
 "id" TEXT NOT NULL PRIMARY KEY,
 "listingId" TEXT NOT NULL REFERENCES "Listing"("id") ON DELETE CASCADE,
 "senderId" INTEGER NOT NULL REFERENCES "Session"("id") ON DELETE CASCADE,
 "ownerId" INTEGER REFERENCES "Session"("id") ON DELETE SET NULL,
 "senderName" TEXT NOT NULL,
 "status" TEXT NOT NULL DEFAULT 'pending',
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX "SessionProposal_listingId_senderId_key" ON "SessionProposal"("listingId", "senderId");
CREATE INDEX "SessionProposal_ownerId_createdAt_idx" ON "SessionProposal"("ownerId", "createdAt");
