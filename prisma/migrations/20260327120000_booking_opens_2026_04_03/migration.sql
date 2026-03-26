-- Align booking portal open with first experience day 11:00 Hong Kong (see CAMPAIGN_EXPERIENCE_FIRST_DAY_KEY + seed defaults).
-- Older DBs may still have 2026-03-31, which made the home countdown show ~4 days from Mar 26 instead of ~7.
UPDATE "system_settings"
SET "value_json" = to_jsonb('2026-04-03T11:00:00+08:00'::text)
WHERE "key" = 'booking_opens_at';
