"use client";

import { useExchangeRates } from "@/hooks/useExchangeRates";
import { AlertTriangle } from "lucide-react";
import { useLocale } from "@/lib/i18n/client";

interface CurrencyDisplayProps {
  brlValue: number | string;
  variant?: 'default' | 'success' | 'transparent' | 'subtextOnly';
}

export function CurrencyDisplay({ brlValue, variant = 'default' }: CurrencyDisplayProps) {
  const { rates, isLoading, isError } = useExchangeRates();
  const { locale } = useLocale();
  const fxLabel = locale === "pt-BR" ? "Câmbio indisponível no momento" : "FX unavailable at the moment";

  const numericBrlValue = typeof brlValue === "string" ? parseFloat(brlValue) : brlValue;

  const formattedBRL = !isNaN(numericBrlValue)
    ? numericBrlValue.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
    : "R$ 0,00";

  const isSuccess = variant === 'success';
  const isTransparent = variant === 'transparent';
  const isSubtextOnly = variant === 'subtextOnly';

  const containerClasses = isSuccess || isTransparent || isSubtextOnly
    ? "flex flex-col w-full min-w-0 break-words"
    : "flex flex-col bg-white dark:bg-[#1c1b18] p-4 rounded-xl border border-slate-200 dark:border-[#2e2c26] shadow-sm transition-all hover:shadow-md w-full min-w-0 break-words";

  const skeletonContainer = isSuccess || isTransparent || isSubtextOnly
    ? "flex flex-col space-y-2 animate-pulse w-full"
    : "flex flex-col space-y-2 animate-pulse bg-slate-50 dark:bg-zinc-900 p-4 rounded-xl border border-slate-100 dark:border-zinc-800 w-full";

  const textClasses = isSuccess
    ? "text-3xl xl:text-4xl font-bold text-emerald-600 leading-none"
    : "text-2xl font-extrabold text-slate-900 dark:text-zinc-50 leading-none";

  const subTextClasses = isSuccess
    ? "text-sm text-emerald-700/80 dark:text-emerald-450/80 font-medium mt-1.5 flex flex-wrap items-center gap-1.5"
    : isSubtextOnly
    ? "text-sm text-slate-500 dark:text-zinc-400 font-medium flex flex-wrap items-center gap-1.5"
    : "text-sm text-slate-500 dark:text-zinc-400 font-medium mt-1.5 flex flex-wrap items-center gap-1.5";

  if (isLoading) {
    return (
      <div className={skeletonContainer}>
        {!isSubtextOnly && <div className={`h-7 w-32 rounded-lg ${isSuccess ? 'bg-emerald-200/50' : 'bg-slate-200'}`}></div>}
        <div className={`h-4 w-48 rounded-md ${isSuccess ? 'bg-emerald-200/50' : 'bg-slate-200'}`}></div>
      </div>
    );
  }

  if (isError || !rates || isNaN(numericBrlValue)) {
    return (
      <div className={containerClasses}>
        {!isSubtextOnly && <p className={textClasses}>{isSuccess && numericBrlValue > 0 ? `+${formattedBRL}` : formattedBRL}</p>}
        <p className="text-xs text-red-500 font-medium mt-1 flex items-center gap-1">
          <AlertTriangle className="w-3 h-3 flex-shrink-0" /> {fxLabel}
        </p>
      </div>
    );
  }

  const formatCrypto = (val: number, maxDecimals: number) => 
    new Intl.NumberFormat('en-US', { 
      maximumFractionDigits: maxDecimals, 
      minimumFractionDigits: 2 
    }).format(val);

  // Calculate trilateral conversions
  const usdcValue = formatCrypto(numericBrlValue / rates.usdToBrl, 2);
  const solValue = formatCrypto(numericBrlValue / rates.solToBrl, 4);

  return (
    <div className={containerClasses}>
      {!isSubtextOnly && (
        <p className={textClasses}>
          {isSuccess && numericBrlValue > 0 ? `+${formattedBRL}` : formattedBRL}
        </p>
      )}
      <p className={subTextClasses}>
        <span>~ {usdcValue} USDC</span>
        <span className={isSuccess ? "text-emerald-350 dark:text-emerald-700" : "text-slate-300 dark:text-zinc-700"}>·</span>
        <span>~ {solValue} SOL</span>
      </p>
    </div>
  );
}
