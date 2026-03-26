import { createHmac, timingSafeEqual } from "crypto";

function pepper(): string {
  const s = process.env.JWT_SECRET;
  if (!s || s.length < 16) {
    throw new Error("JWT_SECRET must be set (min 16 chars) for phone OTP");
  }
  return s;
}

export function hashPhoneOtp(phoneNorm: string, code: string): string {
  return createHmac("sha256", pepper())
    .update(phoneNorm)
    .update("|")
    .update(code)
    .digest("hex");
}

export function verifyPhoneOtp(phoneNorm: string, code: string, codeHash: string): boolean {
  const expected = Buffer.from(hashPhoneOtp(phoneNorm, code), "utf8");
  const actual = Buffer.from(codeHash, "utf8");
  if (expected.length !== actual.length) return false;
  return timingSafeEqual(expected, actual);
}
