import Link from "next/link";
import Image from "next/image";
import { ShieldCheck, Zap, Globe, ArrowRight } from "lucide-react";
import { getServerDict } from "@/lib/i18n/server";

export default async function Home() {
  const { dict } = await getServerDict();

  return (
    <main className="flex min-h-screen flex-col items-center bg-lake-paper text-lake-ink">

      {/* HERO */}
      <section className="relative w-full overflow-hidden lake-wave-soft">
        <div className="absolute inset-0 -z-10 opacity-[0.07]">
          <Image
            src="/brand/lake-wave-banner.png"
            alt=""
            fill
            className="object-cover object-top"
            priority
          />
        </div>

        <div className="w-full max-w-6xl mx-auto px-4 py-24 md:py-32 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/80 backdrop-blur-sm text-lake-cyan-dark text-xs font-extrabold tracking-widest uppercase mb-8 border border-lake-cyan-light/40 shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-lake-cyan opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-lake-cyan"></span>
            </span>
            {dict.hero.protocolBadge}
          </div>

          <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-6 leading-[1.02]">
            {dict.hero.titleLine1} <span className="lake-gradient-text">{dict.hero.titleLine2}</span>
            <br />
            <span className="text-slate-700">{dict.hero.titleSubline}</span>
          </h1>

          <p className="font-body text-xl md:text-2xl text-slate-600 max-w-2xl mx-auto mb-12 leading-relaxed italic">
            {dict.hero.lead}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/marketplace"
              className="px-8 py-4 bg-lake-cyan hover:bg-lake-cyan-dark text-white rounded-2xl font-extrabold text-lg transition-all shadow-[0_8px_24px_rgba(41,171,226,0.35)] hover:shadow-[0_12px_32px_rgba(41,171,226,0.5)] hover:-translate-y-0.5 flex items-center gap-2"
            >
              {dict.hero.ctaPrimary} <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/tokenize"
              className="px-8 py-4 bg-white hover:bg-lake-cyan-soft text-lake-ink border-2 border-slate-200 hover:border-lake-cyan-light rounded-2xl font-extrabold text-lg transition-all shadow-sm flex items-center gap-2"
            >
              {dict.hero.ctaSecondary}
            </Link>
          </div>
        </div>
      </section>

      {/* CARDS DE VALOR */}
      <section className="w-full bg-white border-t border-slate-200/70">
        <div className="max-w-6xl mx-auto px-4 py-20">
          <div className="grid md:grid-cols-3 gap-6">

            <Link
              href="/learn#security"
              className="group p-8 rounded-2xl border border-slate-100 bg-lake-paper hover:bg-white hover:border-lake-cyan-light hover:shadow-xl transition-all duration-300 cursor-pointer relative overflow-hidden card-hover"
            >
              <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <ArrowRight className="w-5 h-5 text-lake-cyan -translate-x-2 group-hover:translate-x-0 transition-transform" />
              </div>
              <div className="w-12 h-12 bg-lake-cyan-soft rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <ShieldCheck className="w-6 h-6 text-lake-cyan-dark" />
              </div>
              <h3 className="text-xl font-black mb-3 text-lake-ink group-hover:text-lake-cyan-dark transition-colors">
                {dict.values.legalTitle}
              </h3>
              <p className="font-body text-slate-600 leading-relaxed">
                {dict.values.legalDesc}
              </p>
            </Link>

            <Link
              href="/learn#liquidity"
              className="group p-8 rounded-2xl border border-slate-100 bg-lake-paper hover:bg-white hover:border-lake-coral hover:shadow-xl transition-all duration-300 cursor-pointer relative overflow-hidden card-hover"
            >
              <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <ArrowRight className="w-5 h-5 text-lake-coral -translate-x-2 group-hover:translate-x-0 transition-transform" />
              </div>
              <div className="w-12 h-12 bg-lake-coral/15 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Zap className="w-6 h-6 text-lake-coral" />
              </div>
              <h3 className="text-xl font-black mb-3 text-lake-ink group-hover:text-lake-coral transition-colors">
                {dict.values.liquidityTitle}
              </h3>
              <p className="font-body text-slate-600 leading-relaxed">
                {dict.values.liquidityDesc}
              </p>
            </Link>

            <Link
              href="/learn#global"
              className="group p-8 rounded-2xl border border-slate-100 bg-lake-paper hover:bg-white hover:border-lake-mint hover:shadow-xl transition-all duration-300 cursor-pointer relative overflow-hidden card-hover"
            >
              <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <ArrowRight className="w-5 h-5 text-green-600 -translate-x-2 group-hover:translate-x-0 transition-transform" />
              </div>
              <div className="w-12 h-12 bg-lake-mint/25 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Globe className="w-6 h-6 text-green-700" />
              </div>
              <h3 className="text-xl font-black mb-3 text-lake-ink group-hover:text-green-700 transition-colors">
                {dict.values.globalTitle}
              </h3>
              <p className="font-body text-slate-600 leading-relaxed">
                {dict.values.globalDesc}
              </p>
            </Link>

          </div>
        </div>
      </section>

      {/* TAGLINE FAIXA */}
      <section className="w-full bg-lake-ink text-white py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="font-body italic text-2xl md:text-3xl text-lake-cyan-light leading-relaxed">
            &quot;{dict.tagline.lineOne}
            <br />
            <span className="text-white not-italic font-display font-black">
              {dict.tagline.lineTwo}
            </span>&quot;
          </p>
        </div>
      </section>

    </main>
  );
}
