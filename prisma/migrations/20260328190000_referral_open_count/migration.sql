-- Track ambassador share-link landing visits (cookie-deduped server-side).
ALTER TABLE "referral_codes" ADD COLUMN IF NOT EXISTS "open_count" INTEGER NOT NULL DEFAULT 0;
