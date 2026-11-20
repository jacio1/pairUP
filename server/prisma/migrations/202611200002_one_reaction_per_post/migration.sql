BEGIN;

LOCK TABLE "SocialReaction" IN ACCESS EXCLUSIVE MODE;

-- Prefer the heart so existing liked listings stay in the profile.
WITH ranked AS (
  SELECT "postId", "profileId", "emoji",
    row_number() OVER (
      PARTITION BY "postId", "profileId"
      ORDER BY ("emoji" = chr(10084) || chr(65039)) DESC, "emoji" COLLATE "C"
    ) AS rank
  FROM "SocialReaction"
)
DELETE FROM "SocialReaction" AS reaction
USING ranked
WHERE reaction."postId" = ranked."postId"
  AND reaction."profileId" = ranked."profileId"
  AND reaction."emoji" = ranked."emoji"
  AND ranked.rank > 1;

ALTER TABLE "SocialReaction"
  DROP CONSTRAINT "SocialReaction_pkey",
  ADD CONSTRAINT "SocialReaction_pkey" PRIMARY KEY ("postId", "profileId");

COMMIT;
