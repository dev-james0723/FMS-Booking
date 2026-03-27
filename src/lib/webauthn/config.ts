import { headers } from "next/headers";

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

/**
 * Use inside Route Handlers so origin / RP ID match the URL the browser actually uses.
 * Fixes Vercel (and similar) when `NEXT_PUBLIC_APP_URL` was left as localhost but users open
 * `https://*.vercel.app` or a custom domain without setting WEBAUTHN_*.
 *
 * Priority: `WEBAUTHN_ORIGIN` → `Host` / `X-Forwarded-Host` → `VERCEL_URL` → `NEXT_PUBLIC_APP_URL`.
 */
export async function getWebAuthnSettingsForRequest(): Promise<{
  rpName: string;
  rpID: string;
  origin: string;
}> {
  const rpName = process.env.WEBAUTHN_RP_NAME?.trim() || DEFAULT_RP_NAME;

  let originStr = process.env.WEBAUTHN_ORIGIN?.trim()?.replace(/\/$/, "");
  if (!originStr) {
    try {
      const h = await headers();
      const hostRaw = (h.get("x-forwarded-host") ?? h.get("host") ?? "").split(",")[0].trim();
      if (hostRaw) {
        let proto = (h.get("x-forwarded-proto") ?? "").split(",")[0].trim().toLowerCase();
        if (proto !== "http" && proto !== "https") {
          proto = process.env.VERCEL === "1" ? "https" : "http";
        }
        originStr = `${proto}://${hostRaw}`.replace(/\/$/, "");
      }
    } catch {
      /* headers() unavailable outside a request */
    }
  }

  if (!originStr && process.env.VERCEL_URL?.trim()) {
    const vu = process.env.VERCEL_URL.trim().replace(/^https?:\/\//, "");
    originStr = `https://${vu}`.replace(/\/$/, "");
  }

  if (!originStr) {
    originStr = appOrigin();
  }

  let hostname: string;
  try {
    hostname = new URL(originStr).hostname;
  } catch {
    const fallback = new URL(appOrigin());
    hostname = fallback.hostname;
    originStr = fallback.origin.replace(/\/$/, "");
  }

  const rpID =
    process.env.WEBAUTHN_RP_ID?.trim() ||
    (hostname === "localhost" || hostname === "127.0.0.1" ? "localhost" : hostname);

  return { rpName, rpID, origin: originStr };
}
