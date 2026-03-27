-- CreateEnum
CREATE TYPE "QuotaTier" AS ENUM ('individual', 'teaching');

-- CreateEnum
CREATE TYPE "BookingIdentityType" AS ENUM ('individual', 'teaching_or_with_students');

-- AlterTable
ALTER TABLE "users" ADD COLUMN "quota_tier" "QuotaTier" NOT NULL DEFAULT 'individual';

-- AlterTable
ALTER TABLE "users" ADD COLUMN "last_booking_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "user_profiles" ADD COLUMN "individual_eligible" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "user_profiles" ADD COLUMN "teaching_eligible" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "booking_requests" ADD COLUMN "booking_identity_type" "BookingIdentityType";

UPDATE "booking_requests"
SET "booking_identity_type" = CASE
  WHEN "user_category_at_request" = 'teaching' THEN 'teaching_or_with_students'::"BookingIdentityType"
  ELSE 'individual'::"BookingIdentityType"
END;

ALTER TABLE "booking_requests" ALTER COLUMN "booking_identity_type" SET NOT NULL;

-- Backfill eligibility from legacy user category
UPDATE "user_profiles" AS p
SET
  "individual_eligible" = CASE WHEN c.code = 'teaching' THEN false ELSE true END,
  "teaching_eligible" = CASE WHEN c.code = 'teaching' THEN true ELSE false END
FROM "users" AS u
JOIN "user_categories" AS c ON u."user_category_id" = c.id
WHERE p."user_id" = u.id;

-- Legacy: personal users with elevated identity tags were treated as extended tier → dual eligibility
UPDATE "user_profiles" AS p
SET "teaching_eligible" = true
FROM "users" AS u
JOIN "user_categories" AS c ON u."user_category_id" = c.id
WHERE p."user_id" = u.id
  AND c.code = 'personal'
  AND (
    p."identity_flags"::jsonb @> '"student"'::jsonb
    OR p."identity_flags"::jsonb @> '"private_teacher"'::jsonb
    OR p."identity_flags"::jsonb @> '"music_tutor"'::jsonb
  );

-- Quota tier: teaching if user has any teaching eligibility
UPDATE "users" AS u
SET "quota_tier" = 'teaching'
FROM "user_profiles" AS p
WHERE p."user_id" = u.id
  AND p."teaching_eligible" = true;

-- Cooldown baseline from existing bookings
UPDATE "users" AS u
SET "last_booking_at" = s.max_req
FROM (
  SELECT "user_id", MAX("requested_at") AS max_req
  FROM "booking_requests"
  WHERE "status" IN ('pending', 'approved', 'waitlisted')
  GROUP BY "user_id"
) AS s
WHERE u.id = s."user_id";
