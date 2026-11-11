CREATE TABLE "User" ("id" TEXT PRIMARY KEY, "role" TEXT NOT NULL);
CREATE TABLE "Session" ("id" SERIAL PRIMARY KEY, "tokenHash" TEXT NOT NULL UNIQUE, "userId" TEXT NOT NULL REFERENCES "User"("id"), "expiresAt" TIMESTAMP(3) NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE "Room" ("id" TEXT PRIMARY KEY, "generation" INTEGER NOT NULL DEFAULT 0);
CREATE TABLE "Listing" ("id" TEXT PRIMARY KEY, "roomId" TEXT NOT NULL UNIQUE REFERENCES "Room"("id"));
CREATE TABLE "Message" ("seq" SERIAL PRIMARY KEY, "id" TEXT NOT NULL UNIQUE, "roomId" TEXT NOT NULL REFERENCES "Room"("id"), "author" TEXT NOT NULL, "sessionId" INTEGER, "kind" TEXT NOT NULL DEFAULT 'human', "text" TEXT NOT NULL, "clientRequestId" TEXT NOT NULL UNIQUE, "targetMessageId" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE INDEX "Message_roomId_seq_idx" ON "Message"("roomId", "seq");
CREATE TABLE "AiJob" ("id" TEXT PRIMARY KEY, "roomId" TEXT NOT NULL REFERENCES "Room"("id"), "clientRequestId" TEXT NOT NULL UNIQUE, "prompt" TEXT NOT NULL, "locale" TEXT NOT NULL, "targetMessageId" TEXT, "generation" INTEGER NOT NULL, "status" TEXT NOT NULL DEFAULT 'pending', "provider" TEXT, "error" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL);
CREATE INDEX "AiJob_roomId_createdAt_idx" ON "AiJob"("roomId", "createdAt");
