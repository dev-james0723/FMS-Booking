/**
 * Optional subpath if the app is ever deployed behind a path prefix again
 * (`NEXT_PUBLIC_BASE_PATH`). Empty in the default setup.
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
