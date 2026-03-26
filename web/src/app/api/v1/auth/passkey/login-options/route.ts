import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk } from "@/lib/api-response";
import { getWebAuthnSettings } from "@/lib/webauthn/config";
import type { AuthenticatorTransportFuture } from "@simplewebauthn/types";
import { generateAuthenticationOptions } from "@simplewebauthn/server";
import { z } from "zod";

const bodySchema = z.object({
  email: z.string().email(),
});

const CHALLENGE_TTL_MS = 5 * 60 * 1000;

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
    select: { id: true, accountStatus: true },
  });

  if (!user || user.accountStatus !== "active") {
    return jsonError("AUTH_INVALID", "此電郵尚未登記或未啟用。", 401);
  }

  const creds = await prisma.webAuthnCredential.findMany({
    where: { userId: user.id },
    select: { credentialId: true, transports: true },
  });

  if (creds.length === 0) {
    return jsonError(
      "NO_PASSKEY",
      "此帳戶尚未綁定 Face ID／指紋登入，請使用電郵及密碼登入。",
      404
    );
  }

  const { rpID, origin } = getWebAuthnSettings();

  const options = await generateAuthenticationOptions({
    rpID,
    timeout: 120_000,
    userVerification: "required",
    allowCredentials: creds.map((c) => ({
      id: c.credentialId,
      type: "public-key" as const,
      transports: Array.isArray(c.transports)
        ? (c.transports as AuthenticatorTransportFuture[])
        : undefined,
    })),
  });

  await prisma.passkeyLoginChallenge.deleteMany({ where: { userId: user.id } });

  const loginRow = await prisma.passkeyLoginChallenge.create({
    data: {
      userId: user.id,
      challengeB64: options.challenge,
      expiresAt: new Date(Date.now() + CHALLENGE_TTL_MS),
    },
  });

  return jsonOk({
    options,
    loginChallengeId: loginRow.id,
    expectedOrigin: origin,
  });
}
