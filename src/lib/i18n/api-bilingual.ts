import type { Locale } from "@/lib/i18n/types";

/** Pick user-facing copy for JSON API errors from the same locale cookie as the site UI. */
export function apiBilingual(locale: Locale, zhHK: string, en: string): string {
  return locale === "en" ? en : zhHK;
}
