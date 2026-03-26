import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk } from "@/lib/api-response";
import { requireUserSession } from "@/lib/auth/require-session";
import { getWebAuthnSettings } from "@/lib/webauthn/config";
import type { AuthenticatorTransportFuture } from "@simplewebauthn/types";
import { generateRegistrationOptions } from "@simplewebauthn/server";

const TTL_MS = 15 * 60 * 1000;

export async function POST() {
  const auth = await requireUserSession();
  if (!auth.ok) return auth.response;

  const user = await prisma.user.findUnique({
    where: { id: auth.userId },
    include: { profile: true },
  });
  if (!user) {
    return jsonError("NOT_FOUND", "找不到帳戶", 404);
  }

  const existing = await prisma.webAuthnCredential.findMany({
    where: { userId: auth.userId },
    select: { credentialId: true, transports: true },
  });

  await prisma.passkeyEnrollmentChallenge.deleteMany({
    where: { userId: auth.userId },
  });

  const { rpName, rpID, origin } = getWebAuthnSettings();
  const displayName = user.profile?.nameZh?.trim() || user.email;
  const userID = new TextEncoder().encode(user.id);

  const options = await generateRegistrationOptions({
    rpName,
    rpID,
    userName: user.email,
    userID,
    userDisplayName: displayName,
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
      residentKey: "preferred",
      userVerification: "required",
    },
  });

  const row = await prisma.passkeyEnrollmentChallenge.create({
    data: {
      userId: auth.userId,
      challengeB64: options.challenge,
      expiresAt: new Date(Date.now() + TTL_MS),
    },
  });

  return jsonOk({
    options,
    enrollmentChallengeId: row.id,
    expectedOrigin: origin,
  });
}
