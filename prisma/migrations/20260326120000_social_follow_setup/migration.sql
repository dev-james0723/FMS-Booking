-- AlterTable
ALTER TABLE "users" ADD COLUMN "social_follow_setup_token" TEXT;

-- AlterTable
ALTER TABLE "user_profiles" ADD COLUMN "social_follow_link_clicks" JSONB NOT NULL DEFAULT '{}';
ALTER TABLE "user_profiles" ADD COLUMN "social_follow_verified" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "user_profiles" ADD COLUMN "social_follow_verified_at" TIMESTAMPTZ;

-- CreateIndex
CREATE UNIQUE INDEX "users_social_follow_setup_token_key" ON "users"("social_follow_setup_token");
