ALTER TABLE "Listing" ADD COLUMN "publicId" SERIAL NOT NULL;
CREATE UNIQUE INDEX "Listing_publicId_key" ON "Listing"("publicId");
