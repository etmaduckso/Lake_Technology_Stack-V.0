"use client";

import { createContext, useCallback, useContext, useMemo, type ReactNode } from "react";
import { dictionaries, type Dict, type Locale } from "./dictionaries";

type Ctx = { locale: Locale; dict: Dict; setLocale: (next: Locale) => void };
const LocaleContext = createContext<Ctx | null>(null);

const COOKIE = "lake_locale";

export function LocaleProvider({ locale, children }: { locale: Locale; children: ReactNode }) {
  const setLocale = useCallback((next: Locale) => {
    document.cookie = `${COOKIE}=${next}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
    window.location.reload();
  }, []);

  const value = useMemo<Ctx>(
    () => ({ locale, dict: dictionaries[locale], setLocale }),
    [locale, setLocale],
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale(): Ctx {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used inside <LocaleProvider>");
  return ctx;
}

export function useDict(): Dict {
  return useLocale().dict;
}
