"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  FMS_LOCALE_EVENT,
  FMS_LOCALE_STORAGE_KEY,
  type Locale,
} from "@/lib/i18n/types";

type LocaleContextValue = {
  locale: Locale;
  setLocale: (next: Locale) => void;
  toggleLocale: () => void;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

function readLocaleFromStorage(): Locale {
  if (typeof window === "undefined") return "zh-HK";
  try {
    const raw = localStorage.getItem(FMS_LOCALE_STORAGE_KEY);
    return raw === "en" ? "en" : "zh-HK";
  } catch {
    return "zh-HK";
  }
}

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  /** SSR and first client paint stay zh-HK to match server HTML; then sync from storage. */
  const [locale, setLocaleState] = useState<Locale>("zh-HK");

  useEffect(() => {
    queueMicrotask(() => setLocaleState(readLocaleFromStorage()));
    const onChange = () => setLocaleState(readLocaleFromStorage());
    window.addEventListener("storage", onChange);
    window.addEventListener(FMS_LOCALE_EVENT, onChange);
    return () => {
      window.removeEventListener("storage", onChange);
      window.removeEventListener(FMS_LOCALE_EVENT, onChange);
    };
  }, []);

  const setLocale = useCallback((next: Locale) => {
    try {
      localStorage.setItem(FMS_LOCALE_STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
    setLocaleState(next);
    window.dispatchEvent(new Event(FMS_LOCALE_EVENT));
  }, []);

  const toggleLocale = useCallback(() => {
    setLocale(locale === "zh-HK" ? "en" : "zh-HK");
  }, [locale, setLocale]);

  const value = useMemo(
    () => ({ locale, setLocale, toggleLocale }),
    [locale, setLocale, toggleLocale],
  );

  useEffect(() => {
    document.documentElement.lang = locale === "en" ? "en" : "zh-HK";
  }, [locale]);

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
}

export function useLocaleContext(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    throw new Error("useLocaleContext must be used within LocaleProvider");
  }
  return ctx;
}
