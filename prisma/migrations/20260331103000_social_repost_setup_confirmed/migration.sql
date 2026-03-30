-- AlterTable
ALTER TABLE "user_profiles" ADD COLUMN "social_repost_setup_confirmed" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "user_profiles" ADD COLUMN "social_repost_setup_confirmed_at" TIMESTAMPTZ;

-- Existing rows: do not block current accounts (new registrations default to false via application create).
UPDATE "user_profiles" SET "social_repost_setup_confirmed" = true;
