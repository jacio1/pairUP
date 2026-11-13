CREATE TABLE "Attachment" (
  "id" TEXT PRIMARY KEY,
  "roomId" TEXT NOT NULL REFERENCES "Room"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "messageId" TEXT UNIQUE REFERENCES "Message"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  "storageKey" TEXT UNIQUE NOT NULL,
  "clientRequestId" TEXT UNIQUE NOT NULL,
  "name" TEXT NOT NULL,
  "size" INTEGER NOT NULL,
  "mime" TEXT NOT NULL,
  "kind" TEXT NOT NULL,
  "author" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "Attachment_roomId_createdAt_idx" ON "Attachment"("roomId", "createdAt");
