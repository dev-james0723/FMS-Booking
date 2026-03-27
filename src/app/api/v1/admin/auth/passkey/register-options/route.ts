import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk } from "@/lib/api-response";
import { requireAdminSession } from "@/lib/auth/require-admin";
import { getWebAuthnSettingsForRequest } from "@/lib/webauthn/config";
import { Prisma } from "@prisma/client";
import type { AuthenticatorTransportFuture } from "@simplewebauthn/types";
import { generateRegistrationOptions } from "@simplewebauthn/server";

const TTL_MS = 15 * 60 * 1000;

export async function POST() {
  const auth = await requireAdminSession();
  if (!auth.ok) return auth.response;

  try {
    const admin = await prisma.adminUser.findUnique({
      where: { id: auth.adminId },
    });
    if (!admin?.isActive) {
      return jsonError("ADMIN_DISABLED", "管理員帳戶已停用", 403);
    }

    const existing = await prisma.adminWebAuthnCredential.findMany({
      where: { adminUserId: auth.adminId },
      select: { credentialId: true, transports: true },
    });

    await prisma.adminPasskeyEnrollmentChallenge.deleteMany({
      where: { adminUserId: auth.adminId },
    });

    const { rpName, rpID, origin } = await getWebAuthnSettingsForRequest();
    const userID = new TextEncoder().encode(admin.id);

    const options = await generateRegistrationOptions({
      rpName,
      rpID,
      userName: admin.email,
      userID,
      userDisplayName: `Admin · ${admin.email}`,
      timeout: 120_000,
      attestationType: "none",
      excludeCredentials: existing.map((c) => ({
        id: c.credentialId,
        type: "public-key" as const,
        transports: Array.isArray(c.transports)
          ? (c.transports as AuthenticatorTransportFuture[])
          : undefined,
      })),
      authenticatorSelection: {
        residentKey: "required",
        userVerification: "required",
      },
    });

    const row = await prisma.adminPasskeyEnrollmentChallenge.create({
      data: {
        adminUserId: auth.adminId,
        challengeB64: options.challenge,
        expiresAt: new Date(Date.now() + TTL_MS),
      },
    });

    return jsonOk({
      options,
      enrollmentChallengeId: row.id,
      expectedOrigin: origin,
    });
  } catch (e) {
    console.error("[admin passkey register-options]", e);
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === "P2021") {
        return jsonError(
          "DB_SCHEMA_MISSING",
          "資料庫尚未建立管理員通行密鑰相關資料表。請在部署環境執行：npx prisma migrate deploy",
          500
        );
      }
    }
    const devTail =
      process.env.NODE_ENV !== "production" && e instanceof Error
        ? `（開發：${e.message.slice(0, 180)}）`
        : "";
    return jsonError(
      "SERVER_ERROR",
      `無法開始綁定（伺服器錯誤）。請執行 npx prisma migrate deploy，並在 Vercel／主機設定與瀏覽器網址一致的 NEXT_PUBLIC_APP_URL，或明確設定 WEBAUTHN_ORIGIN。${devTail}`,
      500
    );
  }
}
