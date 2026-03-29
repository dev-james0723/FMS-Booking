import { withBasePath } from "@/lib/base-path";

export type GoogleAuthStartIntent = "login" | "register" | "admin";

export function googleAuthStartUrl(intent: GoogleAuthStartIntent, next?: string): string {
  const params = new URLSearchParams({ intent });
  if (next) params.set("next", next);
  return withBasePath(`/api/v1/auth/google/start?${params.toString()}`);
}
