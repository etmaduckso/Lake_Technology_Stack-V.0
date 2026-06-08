"use client";

import React from "react";
import { useExchangeRates } from "@/hooks/useExchangeRates";
import { Activity } from "lucide-react";

export function GlobalTicker() {
  const { rates, isLoading } = useExchangeRates();

  if (isLoading || !rates) {
    return (
      <div className="w-full bg-slate-900 text-slate-400 py-1.5 px-4 text-[10px] sm:text-xs flex items-center justify-center border-b border-slate-800">
        <Activity className="w-3 h-3 mr-2 animate-pulse" />
        Sincronizando oráculo de preços...
      </div>
    );
  }

  const solToUsd = rates.solToBrl / rates.usdToBrl;

  return (
    <div className="w-full bg-slate-900 text-slate-300 py-1.5 px-4 text-[10px] sm:text-xs flex items-center justify-center gap-4 border-b border-slate-800 font-medium tracking-wide">
      <div className="flex items-center gap-2">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        <span className="text-slate-400 uppercase">Solana (SOL)</span>
      </div>
      <div className="flex items-center gap-3 font-mono">
        <span className="text-emerald-400">
          R$ {rates.solToBrl.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
        <span className="text-slate-600">|</span>
        <span className="text-blue-400">
          $ {solToUsd.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
        <span className="text-slate-600">|</span>
        <span className="text-slate-400">
          USD/BRL R$ {rates.usdToBrl.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      </div>
    </div>
  );
}
