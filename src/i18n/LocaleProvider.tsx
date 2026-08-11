"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { getNested, interpolate } from "./getMessage";
import { getMessages } from "./messages";
import { DEFAULT_LOCALE, LOCALE_STORAGE_KEY, type Locale } from "./types";

type LocaleContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  dir: "ltr" | "rtl";
  t: (key: string, vars?: Record<string, string | number>) => string;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

function applyDocumentLocale(locale: Locale) {
  document.documentElement.lang = locale;
  document.documentElement.dir = locale === "ar" ? "rtl" : "ltr";
}

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
      if (stored === "en" || stored === "ar") {
        setLocaleState(stored);
        applyDocumentLocale(stored);
      }
    } catch {
      /* ignore */
    }
    setReady(true);
  }, []);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    try {
      localStorage.setItem(LOCALE_STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
    applyDocumentLocale(next);
  }, []);

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => {
      const messages = getMessages(locale);
      const fallback = getMessages("en");
      const raw = getNested(messages as Record<string, unknown>, key)
        ?? getNested(fallback as Record<string, unknown>, key)
        ?? key;
      return vars ? interpolate(raw, vars) : raw;
    },
    [locale]
  );

  const value = useMemo(
    () => ({
      locale,
      setLocale,
      dir: (locale === "ar" ? "rtl" : "ltr") as "ltr" | "rtl",
      t,
    }),
    [locale, setLocale, t]
  );

  if (!ready) {
    return (
      <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
    );
  }

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used within LocaleProvider");
  return ctx;
}

export function useTranslation() {
  const { t, locale, setLocale, dir } = useLocale();
  return { t, locale, setLocale, dir, isRtl: dir === "rtl" };
}
