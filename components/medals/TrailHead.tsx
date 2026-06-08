"use client";

import { useMemo } from "react";
import Link from "next/link";
import { CheckCircle2, Lock, Sparkles } from "lucide-react";
import { useMedals } from "@/context/medals-context";
import { MEDALS, type MedalDefinition } from "@/lib/medals";
import { cn } from "@/lib/utils";
import { useDict } from "@/lib/i18n/client";
import type { Dict } from "@/lib/i18n/dictionaries";

/**
 * Resolve o href correto de cada medalha.
 * Todas as fases têm agora rotas dedicadas com conteúdo interativo.
 * O ciclo linear da trilha é:
 *   /trail/fundamentals → /trail/wallet → /trail/faucet
 *   → /trail/identity → /trail/investor → /trail/legal → /trail
 */
function getHref(medal: MedalDefinition): string {
  const DEDICATED_ROUTES: Record<string, string> = {
    "fase-1-fundamentos":    "/trail/fundamentals",
    "fase-2-carteira":       "/trail/wallet",
    "fase-3-faucet":         "/trail/faucet",
    "fase-4-marketplace":    "/trail/identity",
    "fase-5-tokenizador":    "/trail/investor",
    "fase-pro-institucional": "/trail/legal",
  };
  return DEDICATED_ROUTES[medal.id] ?? `/learn#${medal.anchorId}`;
}

interface BladeProps {
  medal: MedalDefinition;
  earned: boolean;
  index: number;
  tMedals: Dict["medals"];
}

const OFFSETS = [4, 18, 10, 26, 16, 30];

function Blade({ medal, earned, index, tMedals }: BladeProps) {
  const offset = OFFSETS[index] ?? 0;
  const items = tMedals.items as Record<string, { label: string; title: string; tagline: string; criteria: string }>;
  const localized = items[medal.id] ?? {
    label: medal.label,
    title: medal.title,
    tagline: medal.tagline,
    criteria: medal.criteria,
  };

  return (
    <Link
      href={getHref(medal)}
      className={cn(
        "group relative block w-full transition-transform hover:-translate-y-[2px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-lake-cyan rounded-full",
      )}
      style={{ marginLeft: `${offset}%` }}
      aria-label={`${localized.label} — ${localized.title}`}
    >
      <div
        className={cn(
          "flex items-center justify-between gap-4 rounded-full pr-6 pl-5 py-4 shadow-sm border transition-all",
          earned
            ? "shadow-md"
            : "opacity-90 group-hover:opacity-100 grayscale-[20%]",
        )}
        style={{
          background: medal.color,
          borderColor: medal.color,
          color: medal.phase === "PRO" ? "#FFFFFF" : "#0A0A0A",
        }}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={cn(
              "w-10 h-10 shrink-0 rounded-full flex items-center justify-center font-extrabold border-2",
              medal.phase === "PRO"
                ? "bg-white/15 border-white/40 text-white"
                : "bg-white/70 border-white text-slate-900",
            )}
          >
            {medal.phase === "PRO" ? (
              <Sparkles className="w-5 h-5" />
            ) : (
              medal.phase
            )}
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-bold uppercase tracking-[0.18em] opacity-80">
              {localized.label}
            </div>
            <div className="text-lg font-extrabold leading-tight truncate">
              {localized.title}
            </div>
          </div>
        </div>
        <div className="shrink-0">
          {earned ? (
            <CheckCircle2
              className={cn(
                "w-6 h-6",
                medal.phase === "PRO" ? "text-white" : "text-slate-900",
              )}
            />
          ) : (
            <Lock
              className={cn(
                "w-5 h-5",
                medal.phase === "PRO" ? "text-white/70" : "text-slate-900/60",
              )}
            />
          )}
        </div>
      </div>
      <div className="mt-1 px-5 text-xs text-slate-500">
        {earned ? localized.tagline : localized.criteria}
      </div>
    </Link>
  );
}

export function TrailHead() {
  const { isEarned, earned, total } = useMedals();
  const dict = useDict();
  const t = dict.trail;
  const progress = useMemo(
    () => Math.round((earned.length / total) * 100),
    [earned.length, total],
  );

  const progressLine = t.progress
    .replace("{earned}", String(earned.length))
    .replace("{total}", String(total))
    .replace("{progress}", String(progress));

  return (
    <section
      className="relative w-full bg-gradient-to-b from-white via-lake-cyan-soft/40 to-white py-16 md:py-20"
      aria-labelledby="trail-head-title"
    >
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center mb-10">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-lake-cyan-soft text-lake-cyan-dark text-xs font-bold uppercase tracking-widest">
            <Sparkles className="w-4 h-4" />
            {t.eyebrow}
          </span>
          <h2
            id="trail-head-title"
            className="mt-4 text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight"
          >
            {t.title}
          </h2>
          <p className="mt-4 text-slate-600 text-lg leading-relaxed">
            {t.lead}
          </p>
          <div className="mt-6">
            <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
              <div
                className="h-full bg-lake-cyan transition-all duration-700"
                style={{ width: `${progress}%` }}
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={progress}
              />
            </div>
            <div className="mt-2 text-xs font-semibold text-slate-500">
              {progressLine}
            </div>
          </div>
        </div>

        <div className="max-w-3xl mx-auto space-y-3">
          {MEDALS.map((m, i) => (
            <Blade
              key={m.id}
              medal={m}
              earned={isEarned(m.id)}
              index={i}
              tMedals={dict.medals}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
