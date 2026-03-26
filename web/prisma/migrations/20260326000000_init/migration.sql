-- CreateEnum
CREATE TYPE "AccountStatus" AS ENUM ('active', 'inactive', 'suspended');

-- CreateEnum
CREATE TYPE "RegistrationSubmissionStatus" AS ENUM ('pending', 'processed', 'failed');

-- CreateEnum
CREATE TYPE "BookingRequestStatus" AS ENUM ('pending', 'approved', 'rejected', 'waitlisted', 'cancelled', 'no_show', 'completed');

-- CreateEnum
CREATE TYPE "BookingAllocationStatus" AS ENUM ('pending', 'approved', 'released');

-- CreateEnum
CREATE TYPE "EmailLogStatus" AS ENUM ('queued', 'sent', 'failed', 'bounced');

-- CreateEnum
CREATE TYPE "NotificationJobStatus" AS ENUM ('scheduled', 'running', 'completed', 'failed', 'cancelled');

-- CreateEnum
CREATE TYPE "SocialBonusType" AS ENUM ('follow_all', 'repost');

-- CreateEnum
CREATE TYPE "SocialBonusStatus" AS ENUM ('pending', 'approved', 'rejected');

-- CreateEnum
CREATE TYPE "BonusRewardSource" AS ENUM ('social_follow', 'social_repost', 'ambassador_referral', 'admin_grant');

-- CreateEnum
CREATE TYPE "CouponType" AS ENUM ('post_experience_rental', 'dfestival', 'dmasters', 'other');

-- CreateEnum
CREATE TYPE "CouponStatus" AS ENUM ('unused', 'issued', 'redeemed', 'expired');

-- CreateEnum
CREATE TYPE "QrCodeType" AS ENUM ('privilege_dfestival', 'privilege_dmasters', 'referral_ambassador', 'generic');

-- CreateEnum
CREATE TYPE "QrCodeStatus" AS ENUM ('active', 'revoked');

-- CreateEnum
CREATE TYPE "ReferralStatus" AS ENUM ('clicked', 'registered', 'converted');

-- CreateEnum
CREATE TYPE "ConversionType" AS ENUM ('festival', 'competition', 'both');

-- CreateEnum
CREATE TYPE "FestivalConversionStatus" AS ENUM ('intent', 'applied', 'accepted', 'paid');

-- CreateEnum
CREATE TYPE "CompetitionConversionStatus" AS ENUM ('intent', 'applied', 'accepted', 'paid');

-- CreateEnum
CREATE TYPE "AdminRole" AS ENUM ('admin', 'super_admin');

-- CreateEnum
CREATE TYPE "AuditActorType" AS ENUM ('system', 'user', 'admin');

-- CreateTable
CREATE TABLE "user_categories" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name_zh" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "user_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "account_status" "AccountStatus" NOT NULL DEFAULT 'active',
    "has_completed_registration" BOOLEAN NOT NULL DEFAULT false,
    "user_category_id" TEXT,
    "is_first_experience_priority" BOOLEAN NOT NULL DEFAULT true,
    "no_show_count" INTEGER NOT NULL DEFAULT 0,
    "suspended_until" TIMESTAMP(3),
    "referral_attribution_code" TEXT,
    "qualified_for_privilege" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_profiles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name_zh" TEXT NOT NULL,
    "name_en" TEXT,
    "phone" TEXT NOT NULL,
    "age" INTEGER NOT NULL,
    "is_age_17_or_above" BOOLEAN NOT NULL,
    "teacher_recommended" BOOLEAN NOT NULL,
    "teacher_name" TEXT,
    "teacher_contact" TEXT,
    "identity_flags" JSONB NOT NULL,
    "instrument_field" TEXT NOT NULL,
    "usage_purposes" JSONB NOT NULL,
    "preferred_dates" JSONB,
    "preferred_time_text" TEXT,
    "wants_consecutive_slots" BOOLEAN,
    "extra_notes" TEXT,
    "interest_dfestival" BOOLEAN NOT NULL,
    "interest_dmasters" BOOLEAN NOT NULL,
    "marketing_opt_in" BOOLEAN NOT NULL,
    "social_follow_claimed" BOOLEAN NOT NULL DEFAULT false,
    "wants_ambassador" BOOLEAN NOT NULL DEFAULT false,
    "agreed_terms" BOOLEAN NOT NULL,
    "agreed_privacy" BOOLEAN NOT NULL,
    "agreed_email_notifications" BOOLEAN NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "login_credentials" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "must_change_password" BOOLEAN NOT NULL DEFAULT true,
    "last_login_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "login_credentials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "password_reset_tokens" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "registration_submissions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "email" TEXT NOT NULL,
    "payload_snapshot" JSONB NOT NULL,
    "status" "RegistrationSubmissionStatus" NOT NULL DEFAULT 'pending',
    "failure_reason" TEXT,
    "idempotency_key" TEXT,
    "client_ip" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "registration_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "booking_slots" (
    "id" TEXT NOT NULL,
    "starts_at" TIMESTAMP(3) NOT NULL,
    "ends_at" TIMESTAMP(3) NOT NULL,
    "capacity_total" INTEGER NOT NULL DEFAULT 1,
    "capacity_held" INTEGER NOT NULL DEFAULT 0,
    "is_open" BOOLEAN NOT NULL DEFAULT true,
    "venue_label" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "booking_slots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "booking_requests" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "status" "BookingRequestStatus" NOT NULL DEFAULT 'pending',
    "requested_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_category_at_request" TEXT NOT NULL,
    "admin_note" TEXT,
    "uses_bonus_slot" BOOLEAN NOT NULL DEFAULT false,
    "bonus_reward_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "booking_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "booking_allocations" (
    "id" TEXT NOT NULL,
    "booking_request_id" TEXT NOT NULL,
    "booking_slot_id" TEXT NOT NULL,
    "status" "BookingAllocationStatus" NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "booking_allocations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "booking_status_logs" (
    "id" TEXT NOT NULL,
    "booking_request_id" TEXT NOT NULL,
    "from_status" TEXT,
    "to_status" TEXT NOT NULL,
    "actor_type" "AuditActorType" NOT NULL,
    "actor_id" TEXT,
    "meta" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "booking_status_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "template_key" TEXT NOT NULL,
    "to_email" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "provider_message_id" TEXT,
    "status" "EmailLogStatus" NOT NULL DEFAULT 'queued',
    "error" TEXT,
    "payload" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_jobs" (
    "id" TEXT NOT NULL,
    "job_type" TEXT NOT NULL,
    "run_at" TIMESTAMP(3) NOT NULL,
    "status" "NotificationJobStatus" NOT NULL DEFAULT 'scheduled',
    "started_at" TIMESTAMP(3),
    "finished_at" TIMESTAMP(3),
    "meta" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "social_bonus_submissions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "bonus_type" "SocialBonusType" NOT NULL,
    "status" "SocialBonusStatus" NOT NULL DEFAULT 'pending',
    "evidence_urls" JSONB NOT NULL,
    "user_note" TEXT,
    "admin_note" TEXT,
    "reviewed_by" TEXT,
    "reviewed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "social_bonus_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bonus_rewards" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "source" "BonusRewardSource" NOT NULL,
    "slots_granted" INTEGER NOT NULL,
    "slots_remaining" INTEGER NOT NULL,
    "expires_at" TIMESTAMP(3),
    "meta" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bonus_rewards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coupons" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "user_id" TEXT,
    "coupon_type" "CouponType" NOT NULL,
    "status" "CouponStatus" NOT NULL DEFAULT 'issued',
    "valid_from" TIMESTAMP(3) NOT NULL,
    "valid_until" TIMESTAMP(3) NOT NULL,
    "meta" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "coupons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "qr_codes" (
    "id" TEXT NOT NULL,
    "owner_user_id" TEXT,
    "code_type" "QrCodeType" NOT NULL,
    "payload_url" TEXT NOT NULL,
    "image_url" TEXT,
    "bound_coupon_id" TEXT,
    "bound_referral_id" TEXT,
    "status" "QrCodeStatus" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "qr_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "referral_codes" (
    "id" TEXT NOT NULL,
    "ambassador_user_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "max_uses" INTEGER,
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "referral_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "referrals" (
    "id" TEXT NOT NULL,
    "referral_code_id" TEXT NOT NULL,
    "referee_user_id" TEXT,
    "referee_email" TEXT,
    "status" "ReferralStatus" NOT NULL DEFAULT 'clicked',
    "converted_at" TIMESTAMP(3),
    "conversion_type" "ConversionType",
    "admin_override" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "referrals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ambassador_rewards" (
    "id" TEXT NOT NULL,
    "ambassador_user_id" TEXT NOT NULL,
    "referral_id" TEXT NOT NULL,
    "bonus_reward_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ambassador_rewards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "festival_conversion_records" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "coupon_id" TEXT,
    "external_applicant_id" TEXT,
    "status" "FestivalConversionStatus" NOT NULL DEFAULT 'intent',
    "privileged_discount_applied" BOOLEAN NOT NULL DEFAULT false,
    "tuition_discount_200_applied" BOOLEAN NOT NULL DEFAULT false,
    "free_dmasters_preliminary" BOOLEAN NOT NULL DEFAULT false,
    "recorded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "admin_note" TEXT,

    CONSTRAINT "festival_conversion_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "competition_conversion_records" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "coupon_id" TEXT,
    "external_applicant_id" TEXT,
    "status" "CompetitionConversionStatus" NOT NULL DEFAULT 'intent',
    "half_price_preliminary" BOOLEAN NOT NULL DEFAULT false,
    "recorded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "competition_conversion_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "AdminRole" NOT NULL DEFAULT 'admin',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admin_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "admin_user_id" TEXT,
    "action" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT,
    "diff" JSONB,
    "ip" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_settings" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value_json" JSONB NOT NULL,
    "updated_by" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_categories_code_key" ON "user_categories"("code");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "user_profiles_user_id_key" ON "user_profiles"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "login_credentials_user_id_key" ON "login_credentials"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "password_reset_tokens_token_hash_key" ON "password_reset_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "password_reset_tokens_user_id_idx" ON "password_reset_tokens"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "registration_submissions_idempotency_key_key" ON "registration_submissions"("idempotency_key");

-- CreateIndex
CREATE INDEX "registration_submissions_email_idx" ON "registration_submissions"("email");

-- CreateIndex
CREATE INDEX "booking_slots_starts_at_idx" ON "booking_slots"("starts_at");

-- CreateIndex
CREATE INDEX "booking_requests_user_id_idx" ON "booking_requests"("user_id");

-- CreateIndex
CREATE INDEX "booking_requests_status_idx" ON "booking_requests"("status");

-- CreateIndex
CREATE UNIQUE INDEX "booking_allocations_booking_request_id_booking_slot_id_key" ON "booking_allocations"("booking_request_id", "booking_slot_id");

-- CreateIndex
CREATE INDEX "booking_status_logs_booking_request_id_idx" ON "booking_status_logs"("booking_request_id");

-- CreateIndex
CREATE INDEX "email_logs_template_key_idx" ON "email_logs"("template_key");

-- CreateIndex
CREATE INDEX "notification_jobs_job_type_status_idx" ON "notification_jobs"("job_type", "status");

-- CreateIndex
CREATE INDEX "social_bonus_submissions_user_id_bonus_type_idx" ON "social_bonus_submissions"("user_id", "bonus_type");

-- CreateIndex
CREATE INDEX "bonus_rewards_user_id_idx" ON "bonus_rewards"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "coupons_code_key" ON "coupons"("code");

-- CreateIndex
CREATE INDEX "coupons_user_id_idx" ON "coupons"("user_id");

-- CreateIndex
CREATE INDEX "qr_codes_owner_user_id_idx" ON "qr_codes"("owner_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "referral_codes_code_key" ON "referral_codes"("code");

-- CreateIndex
CREATE INDEX "referral_codes_ambassador_user_id_idx" ON "referral_codes"("ambassador_user_id");

-- CreateIndex
CREATE INDEX "referrals_referral_code_id_idx" ON "referrals"("referral_code_id");

-- CreateIndex
CREATE UNIQUE INDEX "ambassador_rewards_referral_id_key" ON "ambassador_rewards"("referral_id");

-- CreateIndex
CREATE UNIQUE INDEX "ambassador_rewards_bonus_reward_id_key" ON "ambassador_rewards"("bonus_reward_id");

-- CreateIndex
CREATE INDEX "ambassador_rewards_ambassador_user_id_idx" ON "ambassador_rewards"("ambassador_user_id");

-- CreateIndex
CREATE INDEX "festival_conversion_records_user_id_idx" ON "festival_conversion_records"("user_id");

-- CreateIndex
CREATE INDEX "competition_conversion_records_user_id_idx" ON "competition_conversion_records"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "admin_users_email_key" ON "admin_users"("email");

-- CreateIndex
CREATE INDEX "audit_logs_entity_type_entity_id_idx" ON "audit_logs"("entity_type", "entity_id");

-- CreateIndex
CREATE UNIQUE INDEX "system_settings_key_key" ON "system_settings"("key");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_user_category_id_fkey" FOREIGN KEY ("user_category_id") REFERENCES "user_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "login_credentials" ADD CONSTRAINT "login_credentials_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registration_submissions" ADD CONSTRAINT "registration_submissions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_requests" ADD CONSTRAINT "booking_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_requests" ADD CONSTRAINT "booking_requests_bonus_reward_id_fkey" FOREIGN KEY ("bonus_reward_id") REFERENCES "bonus_rewards"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_allocations" ADD CONSTRAINT "booking_allocations_booking_request_id_fkey" FOREIGN KEY ("booking_request_id") REFERENCES "booking_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_allocations" ADD CONSTRAINT "booking_allocations_booking_slot_id_fkey" FOREIGN KEY ("booking_slot_id") REFERENCES "booking_slots"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_status_logs" ADD CONSTRAINT "booking_status_logs_booking_request_id_fkey" FOREIGN KEY ("booking_request_id") REFERENCES "booking_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_logs" ADD CONSTRAINT "email_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_bonus_submissions" ADD CONSTRAINT "social_bonus_submissions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bonus_rewards" ADD CONSTRAINT "bonus_rewards_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coupons" ADD CONSTRAINT "coupons_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "qr_codes" ADD CONSTRAINT "qr_codes_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "qr_codes" ADD CONSTRAINT "qr_codes_bound_coupon_id_fkey" FOREIGN KEY ("bound_coupon_id") REFERENCES "coupons"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "qr_codes" ADD CONSTRAINT "qr_codes_bound_referral_id_fkey" FOREIGN KEY ("bound_referral_id") REFERENCES "referrals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referral_codes" ADD CONSTRAINT "referral_codes_ambassador_user_id_fkey" FOREIGN KEY ("ambassador_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_referral_code_id_fkey" FOREIGN KEY ("referral_code_id") REFERENCES "referral_codes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_referee_user_id_fkey" FOREIGN KEY ("referee_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ambassador_rewards" ADD CONSTRAINT "ambassador_rewards_ambassador_user_id_fkey" FOREIGN KEY ("ambassador_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ambassador_rewards" ADD CONSTRAINT "ambassador_rewards_referral_id_fkey" FOREIGN KEY ("referral_id") REFERENCES "referrals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ambassador_rewards" ADD CONSTRAINT "ambassador_rewards_bonus_reward_id_fkey" FOREIGN KEY ("bonus_reward_id") REFERENCES "bonus_rewards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "festival_conversion_records" ADD CONSTRAINT "festival_conversion_records_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "competition_conversion_records" ADD CONSTRAINT "competition_conversion_records_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_admin_user_id_fkey" FOREIGN KEY ("admin_user_id") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

