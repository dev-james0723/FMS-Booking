import { cookies } from "next/headers";
import { getStringByPath } from "@/lib/i18n/get-by-path";
import { localeFromCookieValue } from "@/lib/i18n/locale-cookie";
import { enStrings } from "@/lib/i18n/strings/en";
import { zhHKStrings } from "@/lib/i18n/strings/zh-HK";
import { FMS_LOCALE_STORAGE_KEY, type Locale } from "@/lib/i18n/types";

const DICTS: Record<Locale, unknown> = {
  "zh-HK": zhHKStrings,
  en: enStrings,
};

/** Locale from cookie for server components (aligns with `LocaleProvider` initial state). */
export async function serverLocaleFromCookies(): Promise<Locale> {
  const jar = await cookies();
  return localeFromCookieValue(jar.get(FMS_LOCALE_STORAGE_KEY)?.value);
}

/** Resolve a string path on the server using the same dictionaries as the client. */
export function serverT(locale: Locale, path: string): string {
  return getStringByPath(DICTS[locale], path) ?? path;
}
