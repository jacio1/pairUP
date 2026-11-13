CREATE TABLE "StudyNote" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "roomId" TEXT NOT NULL REFERENCES "Room"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "title" TEXT NOT NULL DEFAULT '',
  "state" BYTEA NOT NULL,
  "version" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE INDEX "StudyNote_roomId_createdAt_idx" ON "StudyNote"("roomId", "createdAt");
CREATE TABLE "StudyTask" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "roomId" TEXT NOT NULL REFERENCES "Room"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "title" TEXT NOT NULL,
  "completed" BOOLEAN NOT NULL DEFAULT false,
  "version" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE INDEX "StudyTask_roomId_createdAt_idx" ON "StudyTask"("roomId", "createdAt");
