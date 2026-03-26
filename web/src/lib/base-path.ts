/**
 * Same value as `basePath` in `next.config.ts`, injected for client bundles.
 * Use for `fetch` and `window.location` (Next `Link` / `redirect` / `router.push` add it automatically).
 */
export function appBasePath(): string {
  return process.env.NEXT_PUBLIC_BASE_PATH ?? "";
}

/** Prefix a root-relative path (e.g. `/api/...`) for same-origin requests. */
export function withBasePath(path: string): string {
  const base = appBasePath();
  const p = path.startsWith("/") ? path : `/${path}`;
  return base ? `${base}${p}` : p;
}
