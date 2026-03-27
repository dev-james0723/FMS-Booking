import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk } from "@/lib/api-response";
import {
  attachAdminSessionCookie,
  signAdminSession,
} from "@/lib/auth/admin-session";
import { getWebAuthnSettingsForRequest } from "@/lib/webauthn/config";
import type {
  AuthenticationResponseJSON,
  AuthenticatorTransportFuture,
} from "@simplewebauthn/types";
import { verifyAuthenticationResponse } from "@simplewebauthn/server";
import { z } from "zod";

const bodySchema = z.object({
  loginChallengeId: z.string().uuid(),
  credential: z.record(z.string(), z.unknown()),
});

export async function POST(req: Request) {
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

  const loginRow = await prisma.adminPasskeyLoginChallenge.findFirst({
    where: {
      id: parsed.data.loginChallengeId,
      expiresAt: { gt: new Date() },
    },
  });

  if (!loginRow) {
    return jsonError(
      "PASSKEY_LOGIN_EXPIRED",
      "登入驗證已逾時，請重新按「使用 Face ID 或 Touch ID 登入」。",
      400
    );
  }

  const assertion = parsed.data.credential as unknown as AuthenticationResponseJSON;
  const credId = assertion.id;
  if (!credId) {
    return jsonError("PASSKEY_VERIFY_FAILED", "回應資料不完整。", 400);
  }

  const dbCred = await prisma.adminWebAuthnCredential.findUnique({
    where: { credentialId: credId },
    include: { admin: true },
  });

  if (!dbCred?.admin?.isActive) {
    return jsonError(
      "PASSKEY_VERIFY_FAILED",
      "找不到有效的管理員通行密鑰，或帳戶已停用。",
      400
    );
  }

  const { rpID, origin } = await getWebAuthnSettingsForRequest();

  const webauthnCredential = {
    id: dbCred.credentialId,
    publicKey: new Uint8Array(dbCred.publicKey),
    counter: Number(dbCred.counter),
    transports: Array.isArray(dbCred.transports)
      ? (dbCred.transports as AuthenticatorTransportFuture[])
      : undefined,
  };

  let authResult;
  try {
    authResult = await verifyAuthenticationResponse({
      response: assertion,
      expectedChallenge: loginRow.challengeB64,
      expectedOrigin: origin,
      expectedRPID: rpID,
      credential: webauthnCredential,
    });
  } catch (e) {
    console.error("[admin passkey login verify]", e);
    return jsonError("PASSKEY_VERIFY_FAILED", "無法驗證，請重試。", 400);
  }

  if (!authResult.verified) {
    return jsonError("PASSKEY_VERIFY_FAILED", "無法驗證，請重試。", 400);
  }

  await prisma.$transaction([
    prisma.adminWebAuthnCredential.update({
      where: { id: dbCred.id },
      data: { counter: BigInt(authResult.authenticationInfo.newCounter) },
    }),
    prisma.adminPasskeyLoginChallenge.delete({ where: { id: loginRow.id } }),
  ]);

  const admin = dbCred.admin;
  const token = await signAdminSession({
    sub: admin.id,
    email: admin.email,
    role: admin.role,
  });

  const res = jsonOk({
    ok: true,
    admin: { id: admin.id, email: admin.email, role: admin.role },
  });
  return attachAdminSessionCookie(res, token);
}
