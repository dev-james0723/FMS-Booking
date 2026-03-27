-- AlterTable
ALTER TABLE "phone_otp_challenges" ALTER COLUMN "expires_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "verified_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "registration_consumed_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "user_profiles" ALTER COLUMN "social_follow_verified_at" SET DATA TYPE TIMESTAMP(3);

-- CreateTable
CREATE TABLE "registration_instrument_images" (
    "instrument_key" TEXT NOT NULL,
    "image_url" TEXT NOT NULL,

    CONSTRAINT "registration_instrument_images_pkey" PRIMARY KEY ("instrument_key")
);

-- RenameIndex
ALTER INDEX "admin_passkey_enrollment_challenges_admin_user_id_expires_at_id" RENAME TO "admin_passkey_enrollment_challenges_admin_user_id_expires_a_idx";
