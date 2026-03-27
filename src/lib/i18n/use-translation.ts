"use client";

import { useCallback, useMemo } from "react";
import { getStringByPath } from "@/lib/i18n/get-by-path";
import { useLocaleContext } from "@/lib/i18n/locale-provider";
import { enStrings } from "@/lib/i18n/strings/en";
import { zhHKStrings, type AppStrings } from "@/lib/i18n/strings/zh-HK";
import type { Locale } from "@/lib/i18n/types";

const DICTS: Record<Locale, AppStrings> = {
  "zh-HK": zhHKStrings,
  en: enStrings,
};

function interpolate(template: string, vars: Record<string, string>) {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => vars[key] ?? `{${key}}`);
}

export function useTranslation() {
  const { locale, setLocale, toggleLocale } = useLocaleContext();
  const dict = DICTS[locale];

  const t = useCallback(
    (path: string) => getStringByPath(dict, path) ?? path,
    [dict],
  );

  const tr = useCallback(
    (path: string, vars: Record<string, string>) => {
      const raw = getStringByPath(dict, path);
      if (!raw) return path;
      return interpolate(raw, vars);
    },
    [dict],
  );

  return useMemo(
    () => ({ t, tr, locale, setLocale, toggleLocale }),
    [t, tr, locale, setLocale, toggleLocale],
  );
}
