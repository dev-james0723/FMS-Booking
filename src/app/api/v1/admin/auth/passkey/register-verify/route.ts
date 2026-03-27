import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk } from "@/lib/api-response";
import { requireAdminSession } from "@/lib/auth/require-admin";
import { getWebAuthnSettingsForRequest } from "@/lib/webauthn/config";
import type { RegistrationResponseJSON } from "@simplewebauthn/types";
import { verifyRegistrationResponse } from "@simplewebauthn/server";
import { z } from "zod";

const bodySchema = z.object({
  enrollmentChallengeId: z.string().uuid(),
  credential: z.record(z.string(), z.unknown()),
});

export async function POST(req: Request) {
  const auth = await requireAdminSession();
  if (!auth.ok) return auth.response;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError("INVALID_JSON", "Invalid JSON body", 400);
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("VALIDATION_ERROR", "Validation failed", 422, parsed.error.flatten());
  }

  const row = await prisma.adminPasskeyEnrollmentChallenge.findFirst({
    where: {
      id: parsed.data.enrollmentChallengeId,
      adminUserId: auth.adminId,
      expiresAt: { gt: new Date() },
    },
  });
  if (!row) {
    return jsonError(
      "ENROLLMENT_EXPIRED",
      "綁定流程已逾時，請重新按「綁定 Face ID／Touch ID」。",
      400
    );
  }

  const { rpID, origin } = await getWebAuthnSettingsForRequest();
  const credential = parsed.data.credential as unknown as RegistrationResponseJSON;

  let verified;
  try {
    verified = await verifyRegistrationResponse({
      response: credential,
      expectedChallenge: row.challengeB64,
      expectedOrigin: origin,
      expectedRPID: rpID,
    });
  } catch (e) {
    console.error("[admin passkey enrollment verify]", e);
    return jsonError(
      "PASSKEY_VERIFY_FAILED",
      "無法驗證此裝置，請重試或使用其他瀏覽器。",
      400
    );
  }

  if (!verified.verified || !verified.registrationInfo) {
    return jsonError("PASSKEY_VERIFY_FAILED", "無法驗證此裝置，請重試。", 400);
  }

  const regCred = verified.registrationInfo.credential;

  const dupUser = await prisma.webAuthnCredential.findUnique({
    where: { credentialId: regCred.id },
    select: { userId: true },
  });
  const dupAdmin = await prisma.adminWebAuthnCredential.findUnique({
    where: { credentialId: regCred.id },
    select: { adminUserId: true },
  });

  if (dupUser || dupAdmin) {
    await prisma.adminPasskeyEnrollmentChallenge.delete({ where: { id: row.id } });
    if (dupAdmin?.adminUserId === auth.adminId) {
      return jsonError("CREDENTIAL_EXISTS", "此通行密鑰已綁定至你的管理員帳戶。", 409);
    }
    return jsonError(
      "CREDENTIAL_IN_USE",
      "此裝置的通行密鑰已用於其他帳戶。",
      409
    );
  }

  const transports =
    Array.isArray(regCred.transports) && regCred.transports.length > 0
      ? regCred.transports
      : null;

  await prisma.$transaction([
    prisma.adminWebAuthnCredential.create({
      data: {
        adminUserId: auth.adminId,
        credentialId: regCred.id,
        publicKey: Buffer.from(regCred.publicKey),
        counter: BigInt(regCred.counter),
        transports: transports ?? undefined,
      },
    }),
    prisma.adminPasskeyEnrollmentChallenge.delete({ where: { id: row.id } }),
  ]);

  return jsonOk({ ok: true });
}
