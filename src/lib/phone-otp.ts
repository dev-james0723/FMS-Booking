import { createHmac, timingSafeEqual } from "crypto";
import { requireJwtSecret } from "@/lib/jwt-secret";

function pepper(): string {
  return requireJwtSecret();
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
