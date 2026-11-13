CREATE TABLE "PublicProfile" (
  "id" SERIAL PRIMARY KEY,
  "sessionId" INTEGER REFERENCES "Session"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  "seedKey" TEXT,
  "name" TEXT NOT NULL,
  "bio" TEXT NOT NULL DEFAULT '',
  "interests" TEXT NOT NULL DEFAULT '',
  "goal" TEXT NOT NULL DEFAULT '',
  "availability" TEXT NOT NULL DEFAULT '',
  "avatar" TEXT NOT NULL DEFAULT 'violet',
  "version" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE UNIQUE INDEX "PublicProfile_sessionId_key" ON "PublicProfile"("sessionId");
CREATE UNIQUE INDEX "PublicProfile_seedKey_key" ON "PublicProfile"("seedKey");
ALTER TABLE "Listing" ADD COLUMN "authorProfileId" INTEGER REFERENCES "PublicProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX "Listing_authorProfileId_createdAt_idx" ON "Listing"("authorProfileId", "createdAt");
INSERT INTO "PublicProfile" ("sessionId", "name", "createdAt", "updatedAt")
SELECT s."id", CASE WHEN u."role" = 'presenter' THEN 'Presenter' ELSE 'TEST #' || s."id" END, s."createdAt", CURRENT_TIMESTAMP
FROM "Session" s JOIN "User" u ON s."userId" = u."id";
UPDATE "Listing" l SET "authorProfileId" = p."id" FROM "PublicProfile" p WHERE p."sessionId" = l."ownerSessionId";
INSERT INTO "PublicProfile" ("seedKey", "name", "updatedAt") VALUES ('english-author', 'Alex', CURRENT_TIMESTAMP);
UPDATE "Listing" SET "authorProfileId" = (SELECT "id" FROM "PublicProfile" WHERE "seedKey" = 'english-author') WHERE "id" = 'demo-listing';
