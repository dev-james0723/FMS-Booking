import { headers } from "next/headers";

const DEFAULT_RP_NAME = "幻樂空間 FMS";

function appOrigin(): string {
  const u = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (u) return u.replace(/\/$/, "");
  return "http://localhost:3000";
}

/** True if `host` may use `rpId` as WebAuthn RP ID (host equals rpId or is a subdomain). */
export function hostMatchesRpId(host: string, rpId: string): boolean {
  if (!host || !rpId) return false;
  return host === rpId || host.endsWith("." + rpId);
}

function originFromHeaderValue(originHeader: string | null): string | undefined {
  const raw = originHeader?.trim();
  if (!raw) return undefined;
  try {
    const u = new URL(raw);
    const okProto =
      u.protocol === "https:" ||
      (u.protocol === "http:" && (u.hostname === "localhost" || u.hostname === "127.0.0.1"));
    if (!okProto) return undefined;
    return u.origin.replace(/\/$/, "");
  } catch {
    return undefined;
  }
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
  const envRp = process.env.WEBAUTHN_RP_ID?.trim();
  const defaultRp =
    url.hostname === "localhost" || url.hostname === "127.0.0.1" ? "localhost" : url.hostname;
  const rpID = envRp && hostMatchesRpId(url.hostname, envRp) ? envRp : defaultRp;
  return {
    rpName: process.env.WEBAUTHN_RP_NAME?.trim() || DEFAULT_RP_NAME,
    rpID,
    origin,
  };
}

/**
 * Use inside Route Handlers so origin / RP ID match the URL the browser actually uses.
 * Fixes Vercel preview when project env sets `WEBAUTHN_ORIGIN` / `WEBAUTHN_RP_ID` for production
 * only — those must not override the hostname the user actually opened.
 *
 * Priority: `Origin` → `Host` / `X-Forwarded-Host` → `VERCEL_URL` → `WEBAUTHN_ORIGIN` →
 * `NEXT_PUBLIC_APP_URL`.
 */
export async function getWebAuthnSettingsForRequest(): Promise<{
  rpName: string;
  rpID: string;
  origin: string;
}> {
  const rpName = process.env.WEBAUTHN_RP_NAME?.trim() || DEFAULT_RP_NAME;

  let originStr: string | undefined;

  try {
    const h = await headers();
    originStr = originFromHeaderValue(h.get("origin"));
    if (!originStr) {
      const hostRaw = (h.get("x-forwarded-host") ?? h.get("host") ?? "").split(",")[0].trim();
      if (hostRaw) {
        let proto = (h.get("x-forwarded-proto") ?? "").split(",")[0].trim().toLowerCase();
        if (proto !== "http" && proto !== "https") {
          proto = process.env.VERCEL === "1" ? "https" : "http";
        }
        originStr = `${proto}://${hostRaw}`.replace(/\/$/, "");
      }
    }
  } catch {
    /* headers() unavailable outside a request */
  }

  if (!originStr && process.env.VERCEL_URL?.trim()) {
    const vu = process.env.VERCEL_URL.trim().replace(/^https?:\/\//, "");
    originStr = `https://${vu}`.replace(/\/$/, "");
  }

  if (!originStr) {
    const envOrigin = process.env.WEBAUTHN_ORIGIN?.trim()?.replace(/\/$/, "");
    originStr = envOrigin || appOrigin();
  }

  let hostname: string;
  try {
    hostname = new URL(originStr).hostname;
  } catch {
    const fallback = new URL(appOrigin());
    hostname = fallback.hostname;
    originStr = fallback.origin.replace(/\/$/, "");
  }

  const envRp = process.env.WEBAUTHN_RP_ID?.trim();
  const defaultRp =
    hostname === "localhost" || hostname === "127.0.0.1" ? "localhost" : hostname;
  const rpID = envRp && hostMatchesRpId(hostname, envRp) ? envRp : defaultRp;

  return { rpName, rpID, origin: originStr };
}
