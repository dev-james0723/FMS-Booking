CREATE TABLE "passkey_enrollment_challenges" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "challenge_b64" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "passkey_enrollment_challenges_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "passkey_enrollment_challenges_user_id_expires_at_idx" ON "passkey_enrollment_challenges"("user_id", "expires_at");

ALTER TABLE "passkey_enrollment_challenges" ADD CONSTRAINT "passkey_enrollment_challenges_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
