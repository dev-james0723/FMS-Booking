/**
 * Twilio credentials are often pasted from dashboards into Vercel; invisible characters
 * (BOM, line/paragraph separators, zero-width spaces) break Basic auth or the From number.
 */
export function sanitizeTwilioSecretValue(value: string | undefined): string | undefined {
  if (value === undefined) return undefined;
  const cleaned = value
    .replace(/^\uFEFF/, "")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/[\u2028\u2029]/g, "")
    .trim();
  return cleaned === "" ? undefined : cleaned;
}
