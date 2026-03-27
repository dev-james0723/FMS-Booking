import { FMS_LOCALE_STORAGE_KEY, type Locale } from "@/lib/i18n/types";

export function localeFromCookieValue(raw: string | undefined): Locale {
  return raw === "en" ? "en" : "zh-HK";
}

/** Mirror preference into a cookie so SSR matches the client dictionary. */
export function writeClientLocaleCookie(locale: Locale): void {
  if (typeof document === "undefined") return;
  try {
    document.cookie = `${FMS_LOCALE_STORAGE_KEY}=${encodeURIComponent(locale)}; Path=/; Max-Age=31536000; SameSite=Lax`;
  } catch {
    /* ignore */
  }
}
