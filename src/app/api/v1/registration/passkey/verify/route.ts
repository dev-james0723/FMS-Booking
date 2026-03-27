import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk } from "@/lib/api-response";
import { signPasskeyPreregToken } from "@/lib/passkey-prereg-token";
import { normalizePhoneForSms } from "@/lib/phone-normalize";
import { requirePhoneVerifiedForRegistration } from "@/lib/registration/require-phone-verified";
import { getWebAuthnSettingsForRequest } from "@/lib/webauthn/config";
import type { RegistrationResponseJSON } from "@simplewebauthn/types";
import { verifyRegistrationResponse } from "@simplewebauthn/server";
import { z } from "zod";

const bodySchema = z.object({
  preregChallengeId: z.string().uuid(),
  email: z.string().email(),
  phone: z.string().min(5).max(30),
  phoneVerificationToken: z.string().min(20).max(2048),
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

  const emailNorm = parsed.data.email.trim().toLowerCase();
  const phoneNorm = normalizePhoneForSms(parsed.data.phone);
  if (!phoneNorm) {
    return jsonError("INVALID_PHONE", "電話號碼格式不正確。", 400);
  }

  const phoneOk = await requirePhoneVerifiedForRegistration(
    phoneNorm,
    parsed.data.phoneVerificationToken
  );
  if (!phoneOk) {
    return jsonError(
      "PHONE_NOT_VERIFIED",
      "請先完成電話短訊驗證（發送驗證碼並輸入正確的 6 位數字）。",
      400
    );
  }

  const row = await prisma.passkeyPreregChallenge.findFirst({
    where: {
      id: parsed.data.preregChallengeId,
      emailNorm,
      phoneNorm,
      credentialId: null,
      expiresAt: { gt: new Date() },
    },
  });
  if (!row) {
    return jsonError(
      "PASSKEY_CHALLENGE_INVALID",
      "生物認證流程已逾時，請在登記頁重新按「綁定 Face ID／指紋」。",
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
    console.error("[passkey prereg verify]", e);
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
  const dup = await prisma.webAuthnCredential.findUnique({
    where: { credentialId: regCred.id },
    select: { userId: true },
  });
  if (dup) {
    return jsonError(
      "CREDENTIAL_IN_USE",
      "此裝置的通行密鑰已綁定另一帳戶，請使用其他裝置完成生物認證。",
      409
    );
  }

  const transports =
    Array.isArray(regCred.transports) && regCred.transports.length > 0
      ? regCred.transports
      : null;

  await prisma.passkeyPreregChallenge.update({
    where: { id: row.id },
    data: {
      credentialId: regCred.id,
      publicKey: Buffer.from(regCred.publicKey),
      counter: BigInt(regCred.counter),
      transports: transports ?? undefined,
      completedAt: new Date(),
    },
  });

  const passkeyPreregToken = await signPasskeyPreregToken(row.id);
  return jsonOk({ ok: true, passkeyPreregToken });
}
