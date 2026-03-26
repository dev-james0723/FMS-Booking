import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk } from "@/lib/api-response";
import { attachUserSessionCookie, signUserSession } from "@/lib/auth/session";
import { getWebAuthnSettings } from "@/lib/webauthn/config";
import type {
  AuthenticationResponseJSON,
  AuthenticatorTransportFuture,
} from "@simplewebauthn/types";
import { verifyAuthenticationResponse } from "@simplewebauthn/server";
import { z } from "zod";

const bodySchema = z.object({
  email: z.string().email(),
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

  const email = parsed.data.email.trim().toLowerCase();
  const user = await prisma.user.findUnique({
    where: { email },
    include: { credentials: true },
  });

  if (!user?.credentials) {
    return jsonError("AUTH_INVALID", "此電郵尚未登記。", 401);
  }

  if (user.accountStatus !== "active") {
    return jsonError("AUTH_DISABLED", "Account is not active", 403);
  }

  const loginRow = await prisma.passkeyLoginChallenge.findFirst({
    where: {
      id: parsed.data.loginChallengeId,
      userId: user.id,
      expiresAt: { gt: new Date() },
    },
  });

  if (!loginRow) {
    return jsonError(
      "PASSKEY_LOGIN_EXPIRED",
      "登入驗證已逾時，請重新按「Face ID／指紋登入」。",
      400
    );
  }

  const assertion = parsed.data.credential as unknown as AuthenticationResponseJSON;
  const credId = assertion.id;
  if (!credId) {
    return jsonError("PASSKEY_VERIFY_FAILED", "回應資料不完整。", 400);
  }

  const dbCred = await prisma.webAuthnCredential.findFirst({
    where: { userId: user.id, credentialId: credId },
  });
  if (!dbCred) {
    return jsonError("PASSKEY_VERIFY_FAILED", "找不到此裝置的通行密鑰。", 400);
  }

  const { rpID, origin } = getWebAuthnSettings();

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
    console.error("[passkey login verify]", e);
    return jsonError("PASSKEY_VERIFY_FAILED", "無法驗證，請重試。", 400);
  }

  if (!authResult.verified) {
    return jsonError("PASSKEY_VERIFY_FAILED", "無法驗證，請重試。", 400);
  }

  await prisma.$transaction([
    prisma.webAuthnCredential.update({
      where: { id: dbCred.id },
      data: { counter: BigInt(authResult.authenticationInfo.newCounter) },
    }),
    prisma.passkeyLoginChallenge.deleteMany({ where: { userId: user.id } }),
    prisma.loginCredential.update({
      where: { userId: user.id },
      data: { lastLoginAt: new Date() },
    }),
  ]);

  const token = await signUserSession({
    sub: user.id,
    email: user.email,
    accountStatus: user.accountStatus,
    mustChangePassword: user.credentials.mustChangePassword,
    hasCompletedRegistration: user.hasCompletedRegistration,
  });

  const res = jsonOk({
    ok: true,
    mustChangePassword: user.credentials.mustChangePassword,
    user: {
      id: user.id,
      email: user.email,
      mustChangePassword: user.credentials.mustChangePassword,
      hasCompletedRegistration: user.hasCompletedRegistration,
    },
  });
  return attachUserSessionCookie(res, token);
}
