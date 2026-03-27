import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk } from "@/lib/api-response";
import { getWebAuthnSettingsForRequest } from "@/lib/webauthn/config";
import { generateAuthenticationOptions } from "@simplewebauthn/server";

const CHALLENGE_TTL_MS = 5 * 60 * 1000;

export async function POST() {
  const anyAdminPasskey = await prisma.adminWebAuthnCredential.findFirst({
    select: { id: true },
  });
  if (!anyAdminPasskey) {
    return jsonError(
      "NO_ADMIN_PASSKEY",
      "尚未有管理員綁定 Face ID／Touch ID。請先以電郵及密碼登入，再於提示中綁定此裝置。",
      404
    );
  }

  await prisma.adminPasskeyLoginChallenge.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });

  const { rpID } = await getWebAuthnSettingsForRequest();

  const options = await generateAuthenticationOptions({
    rpID,
    timeout: 120_000,
    userVerification: "required",
  });

  const loginRow = await prisma.adminPasskeyLoginChallenge.create({
    data: {
      challengeB64: options.challenge,
      expiresAt: new Date(Date.now() + CHALLENGE_TTL_MS),
    },
  });

  return jsonOk({
    options,
    loginChallengeId: loginRow.id,
  });
}
