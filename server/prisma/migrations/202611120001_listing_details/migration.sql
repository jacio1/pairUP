ALTER TABLE "Listing"
  ADD COLUMN "ownerSessionId" INTEGER,
  ADD COLUMN "authorName" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "title" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "subject" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "level" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "goal" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "format" TEXT NOT NULL DEFAULT 'online',
  ADD COLUMN "schedule" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "location" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "description" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "Listing" ADD CONSTRAINT "Listing_ownerSessionId_fkey"
  FOREIGN KEY ("ownerSessionId") REFERENCES "Session"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX "Listing_ownerSessionId_createdAt_idx" ON "Listing"("ownerSessionId", "createdAt");
CREATE INDEX "Listing_createdAt_idx" ON "Listing"("createdAt");
