ALTER TABLE "Message" ADD COLUMN "authorProfileId" INTEGER REFERENCES "PublicProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
UPDATE "Message" m SET "authorProfileId"=p."id" FROM "PublicProfile" p WHERE m."sessionId"=p."sessionId" AND m."kind" <> 'ai';
