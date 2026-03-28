import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk } from "@/lib/api-response";
import { isJwtSecretConfigured } from "@/lib/jwt-secret";
import { normalizePhoneForSms } from "@/lib/phone-normalize";
import { hashPhoneOtp } from "@/lib/phone-otp";
import { sendSms } from "@/lib/sms/send-sms";
import { randomInt } from "crypto";
import { z } from "zod";

const bodySchema = z.object({
  phone: z.string().min(5).max(30),
});

const SEND_COOLDOWN_MS = 60_000;
const OTP_TTL_MS = 10 * 60 * 1000;
const MAX_SENDS_PER_HOUR = 5;

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

  try {
    const phoneNorm = normalizePhoneForSms(parsed.data.phone);
    if (!phoneNorm) {
      return jsonError("INVALID_PHONE", "電話號碼格式不正確，請輸入有效手機號碼（例如 91234567 或 +852…）。", 400);
    }

    if (!isJwtSecretConfigured()) {
      console.error(
        "[registration/phone/send-code] JWT_SECRET missing or shorter than 16 characters (required for OTP hashing)"
      );
      return jsonError(
        "SERVER_MISCONFIGURED",
        "伺服器設定未完成，暫時無法發送驗證碼。請聯絡主辦方。",
        500
      );
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

    const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentSends = await prisma.phoneOtpChallenge.count({
      where: { phoneNorm, createdAt: { gte: hourAgo } },
    });
    if (recentSends >= MAX_SENDS_PER_HOUR) {
      return jsonError(
        "RATE_LIMIT",
        "此號碼短時間內已多次索取驗證碼，請 1 小時後再試。",
        429
      );
    }

    const latest = await prisma.phoneOtpChallenge.findFirst({
      where: { phoneNorm, verifiedAt: null },
      orderBy: { createdAt: "desc" },
    });
    if (latest && latest.createdAt.getTime() > Date.now() - SEND_COOLDOWN_MS) {
      const waitSec = Math.ceil(
        (SEND_COOLDOWN_MS - (Date.now() - latest.createdAt.getTime())) / 1000
      );
      return jsonError(
        "COOLDOWN",
        `請 ${waitSec} 秒後再索取驗證碼。`,
        429
      );
    }

    const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
    const codeHash = hashPhoneOtp(phoneNorm, code);
    const expiresAt = new Date(Date.now() + OTP_TTL_MS);

    const challenge = await prisma.phoneOtpChallenge.create({
      data: {
        phoneNorm,
        codeHash,
        expiresAt,
      },
    });

    const smsBody = `【幻樂空間 / D Festival】你的登記驗證碼：${code}（10 分鐘內有效，請勿向他人透露。）`;
    const sms = await sendSms({ toE164: phoneNorm, body: smsBody });

    if (!sms.ok) {
      await prisma.phoneOtpChallenge.delete({ where: { id: challenge.id } });
      return jsonError("SMS_FAILED", sms.error, 502);
    }

    return jsonOk({ ok: true, smsDevMode: Boolean(sms.dev) });
  } catch (e) {
    console.error("[registration/phone/send-code]", e);
    if (e instanceof Error && e.message.includes("JWT_SECRET")) {
      return jsonError(
        "SERVER_MISCONFIGURED",
        "伺服器設定未完成，暫時無法發送驗證碼。請聯絡主辦方。",
        500
      );
    }
    if (
      e instanceof Prisma.PrismaClientKnownRequestError ||
      e instanceof Prisma.PrismaClientInitializationError
    ) {
      return jsonError(
        "DATABASE_ERROR",
        "無法連接資料庫或寫入驗證資料。請稍後再試；如問題持續，請聯絡主辦方。",
        500
      );
    }
    return jsonError(
      "INTERNAL",
      "驗證碼發送時發生錯誤，請稍後再試。",
      500
    );
  }
}
