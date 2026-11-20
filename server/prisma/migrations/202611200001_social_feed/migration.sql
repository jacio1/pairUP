-- CreateTable
CREATE TABLE "SocialPost" (
    "id" TEXT NOT NULL,
    "listingId" TEXT,
    "authorId" INTEGER,
    "text" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SocialPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SocialMedia" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "mime" TEXT NOT NULL,
    "position" INTEGER NOT NULL,

    CONSTRAINT "SocialMedia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SocialReaction" (
    "postId" TEXT NOT NULL,
    "profileId" INTEGER NOT NULL,
    "emoji" TEXT NOT NULL,

    CONSTRAINT "SocialReaction_pkey" PRIMARY KEY ("postId","profileId","emoji")
);

-- CreateTable
CREATE TABLE "SocialComment" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "authorId" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SocialComment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SocialPost_listingId_key" ON "SocialPost"("listingId");

-- CreateIndex
CREATE INDEX "SocialPost_listingId_createdAt_idx" ON "SocialPost"("listingId", "createdAt");

-- CreateIndex
CREATE INDEX "SocialPost_authorId_createdAt_idx" ON "SocialPost"("authorId", "createdAt");

-- CreateIndex
CREATE INDEX "SocialMedia_postId_position_idx" ON "SocialMedia"("postId", "position");

-- CreateIndex
CREATE INDEX "SocialReaction_profileId_emoji_idx" ON "SocialReaction"("profileId", "emoji");

-- CreateIndex
CREATE INDEX "SocialComment_postId_createdAt_idx" ON "SocialComment"("postId", "createdAt");

-- AddForeignKey
ALTER TABLE "SocialPost" ADD CONSTRAINT "SocialPost_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialPost" ADD CONSTRAINT "SocialPost_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "PublicProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialMedia" ADD CONSTRAINT "SocialMedia_postId_fkey" FOREIGN KEY ("postId") REFERENCES "SocialPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialReaction" ADD CONSTRAINT "SocialReaction_postId_fkey" FOREIGN KEY ("postId") REFERENCES "SocialPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialReaction" ADD CONSTRAINT "SocialReaction_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "PublicProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialComment" ADD CONSTRAINT "SocialComment_postId_fkey" FOREIGN KEY ("postId") REFERENCES "SocialPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialComment" ADD CONSTRAINT "SocialComment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "PublicProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
INSERT INTO "SocialPost" ("id", "listingId", "createdAt")
SELECT 'listing-' || "id", "id", "createdAt" FROM "Listing";
