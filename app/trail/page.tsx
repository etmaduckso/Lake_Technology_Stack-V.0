"use client";

import { TrailHead } from "@/components/medals/TrailHead";
import { MedalsGrid } from "@/components/medals/MedalsGrid";

export default function TrailPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 scroll-smooth">
      <TrailHead />
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-5xl mx-auto bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
          <MedalsGrid />
        </div>
      </div>
    </div>
  );
}
