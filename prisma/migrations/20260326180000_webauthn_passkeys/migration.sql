-- WebAuthn (passkey) credentials and challenge tables

CREATE TABLE "webauthn_credentials" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "credential_id" TEXT NOT NULL,
    "public_key" BYTEA NOT NULL,
    "counter" BIGINT NOT NULL DEFAULT 0,
    "transports" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "webauthn_credentials_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "webauthn_credentials_credential_id_key" ON "webauthn_credentials"("credential_id");

CREATE INDEX "webauthn_credentials_user_id_idx" ON "webauthn_credentials"("user_id");

ALTER TABLE "webauthn_credentials" ADD CONSTRAINT "webauthn_credentials_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "passkey_prereg_challenges" (
    "id" TEXT NOT NULL,
    "email_norm" TEXT NOT NULL,
    "phone_norm" TEXT NOT NULL,
    "challenge_b64" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "credential_id" TEXT,
    "public_key" BYTEA,
    "counter" BIGINT,
    "transports" JSONB,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "passkey_prereg_challenges_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "passkey_prereg_challenges_credential_id_key" ON "passkey_prereg_challenges"("credential_id");

CREATE INDEX "passkey_prereg_challenges_email_norm_phone_norm_idx" ON "passkey_prereg_challenges"("email_norm", "phone_norm");

CREATE TABLE "passkey_login_challenges" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "challenge_b64" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "passkey_login_challenges_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "passkey_login_challenges_user_id_expires_at_idx" ON "passkey_login_challenges"("user_id", "expires_at");

ALTER TABLE "passkey_login_challenges" ADD CONSTRAINT "passkey_login_challenges_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
