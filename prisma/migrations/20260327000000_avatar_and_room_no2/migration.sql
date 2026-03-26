-- AlterTable
ALTER TABLE "user_profiles" ADD COLUMN "favorite_avatar_animal" TEXT,
ADD COLUMN "avatar_image_data_url" TEXT;

-- Backfill venue label (幻樂空間 · Studio A → Room No.2)
UPDATE "booking_slots"
SET "venue_label" = '幻樂空間 · Room No.2'
WHERE "venue_label" IS NOT NULL
  AND ("venue_label" = '幻樂空間 · Studio A' OR "venue_label" LIKE '%Studio A%');

-- Align default rolling limit for personal users (7 → 8 sessions / any 3 consecutive HK days)
UPDATE "system_settings"
SET "value_json" = '8'::jsonb
WHERE "key" = 'personal_max_slots_any_3_consecutive_days'
  AND "value_json" = '7'::jsonb;
