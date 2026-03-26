const DEFAULT_RP_NAME = "幻樂空間 FMS";

function appOrigin(): string {
  const u = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (u) return u.replace(/\/$/, "");
  return "http://localhost:3000";
}

/**
 * WebAuthn RP ID must be a registrable domain suffix of the page origin (no port).
 * Override with WEBAUTHN_RP_ID / WEBAUTHN_ORIGIN when deploying behind proxies or multi-domain.
 */
export function getWebAuthnSettings(): { rpName: string; rpID: string; origin: string } {
  const origin = process.env.WEBAUTHN_ORIGIN?.trim() || appOrigin();
  let url: URL;
  try {
    url = new URL(origin);
  } catch {
    url = new URL("http://localhost:3000");
  }
  const rpID =
    process.env.WEBAUTHN_RP_ID?.trim() ||
    (url.hostname === "localhost" || url.hostname === "127.0.0.1" ? "localhost" : url.hostname);
  return {
    rpName: process.env.WEBAUTHN_RP_NAME?.trim() || DEFAULT_RP_NAME,
    rpID,
    origin,
  };
}
