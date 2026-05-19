-- Extend free experience booking window to 20 May – 15 June 2026 (Hong Kong).
-- After deploy, run: npx tsx scripts/backfill-booking-slots-6-20-hkt.ts

UPDATE "system_settings"
SET "value_json" = to_jsonb('2026-05-20T11:00:00+08:00'::text)
WHERE "key" = 'booking_opens_at';

UPDATE "system_settings"
SET "value_json" = to_jsonb('2026-05-20T00:00:00+08:00'::text)
WHERE "key" = 'campaign_starts_at';

UPDATE "system_settings"
SET "value_json" = to_jsonb('2026-06-15T23:59:59+08:00'::text)
WHERE "key" = 'campaign_ends_at';

UPDATE "system_settings"
SET "value_json" = to_jsonb('2026-06-15T23:59:59+08:00'::text)
WHERE "key" = 'dfestival_dmasters_privilege_deadline_at';

UPDATE "system_settings"
SET "value_json" = to_jsonb('2026-06-16T00:00:00+08:00'::text)
WHERE "key" = 'post_experience_coupon_valid_from';
