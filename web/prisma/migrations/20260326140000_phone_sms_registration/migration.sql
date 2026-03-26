-- CreateTable
CREATE TABLE "phone_otp_challenges" (
    "id" TEXT NOT NULL,
    "phone_norm" TEXT NOT NULL,
    "code_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMPTZ NOT NULL,
    "verify_attempts" INTEGER NOT NULL DEFAULT 0,
    "verified_at" TIMESTAMPTZ,
    "registration_consumed_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "phone_otp_challenges_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "phone_otp_challenges_phone_norm_created_at_idx" ON "phone_otp_challenges"("phone_norm", "created_at");

-- CreateIndex (fails if duplicate phones already exist — clean data first)
CREATE UNIQUE INDEX "user_profiles_phone_key" ON "user_profiles"("phone");
