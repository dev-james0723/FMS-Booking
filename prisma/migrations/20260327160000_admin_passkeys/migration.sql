-- CreateTable
CREATE TABLE "admin_webauthn_credentials" (
    "id" TEXT NOT NULL,
    "admin_user_id" TEXT NOT NULL,
    "credential_id" TEXT NOT NULL,
    "public_key" BYTEA NOT NULL,
    "counter" BIGINT NOT NULL DEFAULT 0,
    "transports" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_webauthn_credentials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_passkey_login_challenges" (
    "id" TEXT NOT NULL,
    "challenge_b64" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_passkey_login_challenges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_passkey_enrollment_challenges" (
    "id" TEXT NOT NULL,
    "admin_user_id" TEXT NOT NULL,
    "challenge_b64" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_passkey_enrollment_challenges_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "admin_webauthn_credentials_credential_id_key" ON "admin_webauthn_credentials"("credential_id");

-- CreateIndex
CREATE INDEX "admin_webauthn_credentials_admin_user_id_idx" ON "admin_webauthn_credentials"("admin_user_id");

-- CreateIndex
CREATE INDEX "admin_passkey_login_challenges_expires_at_idx" ON "admin_passkey_login_challenges"("expires_at");

-- CreateIndex
CREATE INDEX "admin_passkey_enrollment_challenges_admin_user_id_expires_at_idx" ON "admin_passkey_enrollment_challenges"("admin_user_id", "expires_at");

-- AddForeignKey
ALTER TABLE "admin_webauthn_credentials" ADD CONSTRAINT "admin_webauthn_credentials_admin_user_id_fkey" FOREIGN KEY ("admin_user_id") REFERENCES "admin_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_passkey_enrollment_challenges" ADD CONSTRAINT "admin_passkey_enrollment_challenges_admin_user_id_fkey" FOREIGN KEY ("admin_user_id") REFERENCES "admin_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
