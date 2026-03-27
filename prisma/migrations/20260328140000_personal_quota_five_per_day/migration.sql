-- Align personal / teacher-referred daily cap with product rules (5 slots / day, 7 per rolling 3 HK days).
UPDATE "system_settings"
SET "value_json" = '5'::jsonb
WHERE "key" = 'personal_max_slots_per_day';
