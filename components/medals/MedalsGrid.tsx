"use client";

import { useMedals, MEDALS } from "@/context/medals-context";
import { MedalBadge } from "./MedalBadge";
import { useDict } from "@/lib/i18n/client";

export function MedalsGrid({
  size = "md",
}: {
  size?: "sm" | "md" | "lg";
}) {
  const { isEarned, earned, total } = useMedals();
  const dict = useDict();

  return (
    <div className="space-y-6">
      <div className="flex items-baseline justify-between">
        <h3 className="text-lg font-extrabold text-slate-900">
          {dict.medals.myMedals}
        </h3>
        <span className="text-sm text-slate-500 font-semibold">
          {earned.length} / {total}
        </span>
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
        {MEDALS.map((m) => (
          <MedalBadge
            key={m.id}
            medal={m}
            earned={isEarned(m.id)}
            size={size}
          />
        ))}
      </div>
    </div>
  );
}
