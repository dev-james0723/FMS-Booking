-- Allow passkey login challenges without a pre-selected user (discoverable / usernameless WebAuthn).
ALTER TABLE "passkey_login_challenges" ALTER COLUMN "user_id" DROP NOT NULL;
