/** Persisted for registration when visitor arrives via `?ref=` or QR. */
export const PENDING_REFERRAL_SESSION_KEY = "fms_pending_referral_code";

export function isValidReferralCodeParam(raw: string): boolean {
  return /^[0-9a-z]{12}$/.test(raw.trim().toLowerCase());
}

/** One-time intro modal per browser per referral code. */
export function ambassadorIntroStorageKey(code: string): string {
  return `fms_ambassador_intro_v1_${code}`;
}

/** Cookie: already counted this referral open in this browser session. */
export function referralTrackCookieName(code: string): string {
  return `fms_ref_trk_${code}`;
}
