/**
 * Sanitize `next` query params for post-auth client navigations.
 * Rejects absolute URLs, protocol-relative paths, and backslashes (open-redirect hardening).
 */
export function safeNextPath(raw: string | null | undefined, fallback: string): string {
  if (raw == null || raw.length > 512) return fallback;
  const t = raw.trim();
  if (!t.startsWith("/") || t.startsWith("//") || t.includes("://") || t.includes("\\")) {
    return fallback;
  }
  return t;
}

/** Admin post-login `next` must stay under `/admin`. */
export function safeAdminNextPath(raw: string | null | undefined, fallback: string): string {
  const p = safeNextPath(raw, fallback);
  if (!p.startsWith("/admin")) return fallback;
  return p;
}
