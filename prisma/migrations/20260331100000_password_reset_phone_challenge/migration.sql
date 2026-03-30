-- Password reset via SMS OTP (separate from registration phone_otp_challenges).

CREATE TABLE "password_reset_phone_challenges" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "phone_norm" TEXT NOT NULL,
    "code_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "verify_attempts" INTEGER NOT NULL DEFAULT 0,
    "verified_at" TIMESTAMP(3),
    "consumed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_reset_phone_challenges_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "password_reset_phone_challenges_user_id_created_at_idx" ON "password_reset_phone_challenges"("user_id", "created_at");

CREATE INDEX "password_reset_phone_challenges_phone_norm_created_at_idx" ON "password_reset_phone_challenges"("phone_norm", "created_at");

ALTER TABLE "password_reset_phone_challenges" ADD CONSTRAINT "password_reset_phone_challenges_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
