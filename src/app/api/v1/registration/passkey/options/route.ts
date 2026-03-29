import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk } from "@/lib/api-response";
import { normalizePhoneForSms } from "@/lib/phone-normalize";
import { requirePhoneVerifiedForRegistration } from "@/lib/registration/require-phone-verified";
import { getWebAuthnSettingsForRequest } from "@/lib/webauthn/config";
import { generateRegistrationOptions } from "@simplewebauthn/server";
import { randomBytes } from "node:crypto";
import { z } from "zod";

const bodySchema = z.object({
  email: z.string().email(),
  phone: z.string().min(5).max(30),
  phoneVerificationToken: z.string().min(20).max(2048),
  displayName: z.string().trim().max(120).optional(),
});

const PREREG_TTL_MS = 15 * 60 * 1000;

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

  const emailTaken = await prisma.user.findUnique({
    where: { email: emailNorm },
    select: { id: true },
  });
  if (emailTaken) {
    return jsonError("EMAIL_EXISTS", "此電郵已被登記，請直接登入。", 409);
  }

  const phoneTaken = await prisma.userProfile.findUnique({
    where: { phone: phoneNorm },
    select: { userId: true },
  });
  if (phoneTaken) {
    return jsonError(
      "PHONE_EXISTS",
      "此電話號碼已用於登記另一個帳戶；每個號碼只可綁定一個帳戶。",
      409
    );
  }

  await prisma.passkeyPreregChallenge.deleteMany({
    where: { emailNorm, phoneNorm },
  });

  const { rpName, rpID, origin } = await getWebAuthnSettingsForRequest();
  const userID = new Uint8Array(randomBytes(32));
  const display =
    parsed.data.displayName && parsed.data.displayName.length > 0
      ? parsed.data.displayName
      : emailNorm;

  const options = await generateRegistrationOptions({
    rpName,
    rpID,
    userName: emailNorm,
    userID,
    userDisplayName: display,
    timeout: 120_000,
    attestationType: "none",
    authenticatorSelection: {
      residentKey: "required",
      userVerification: "required",
    },
  });

  const expiresAt = new Date(Date.now() + PREREG_TTL_MS);
  const row = await prisma.passkeyPreregChallenge.create({
    data: {
      emailNorm,
      phoneNorm,
      challengeB64: options.challenge,
      expiresAt,
    },
  });

  return jsonOk({
    options,
    preregChallengeId: row.id,
    /** Hint for clients (e.g. conditional UI); server still enforces origin. */
    expectedOrigin: origin,
  });
}
