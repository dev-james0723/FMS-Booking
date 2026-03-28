/**
 * Single place for JWT_SECRET length rules (sessions, phone OTP HMAC, registration proof JWT).
 * Trims whitespace so values pasted from env UIs with accidental newlines still work.
 */
export function isJwtSecretConfigured(): boolean {
  const s = process.env.JWT_SECRET?.trim();
  return Boolean(s && s.length >= 16);
}

export function requireJwtSecret(): string {
  const s = process.env.JWT_SECRET?.trim();
  if (!s || s.length < 16) {
    throw new Error("JWT_SECRET must be set (min 16 chars)");
  }
  return s;
}

/** For jose / Web Crypto callers that need a Uint8Array key. */
export function jwtSecretKeyBytes(): Uint8Array {
  return new TextEncoder().encode(requireJwtSecret());
}
