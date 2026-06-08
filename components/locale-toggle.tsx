"use client";

import { useLocale } from "@/lib/i18n/client";
import { Globe } from "lucide-react";

export function LocaleToggle({ compact = false }: { compact?: boolean }) {
  const { locale, setLocale } = useLocale();
  const next = locale === "pt-BR" ? "en" : "pt-BR";
  const label = locale === "pt-BR" ? "EN" : "PT";
  const aria = locale === "pt-BR" ? "Switch to English" : "Mudar para Português";

  return (
    <button
      type="button"
      onClick={() => setLocale(next)}
      aria-label={aria}
      title={aria}
      className={
        compact
          ? "flex items-center gap-1 px-2 py-1 rounded-md text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
          : "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 hover:text-lake-cyan-dark hover:bg-lake-cyan-soft border border-slate-200 transition-colors"
      }
    >
      <Globe className="w-3.5 h-3.5" />
      {label}
    </button>
  );
}
