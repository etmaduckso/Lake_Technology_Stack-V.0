"use client";

import { useEffect } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  FileText,
  Landmark,
  ArrowLeft,
  Trophy,
} from "lucide-react";
import { useWallet } from "@/context/wallet-context";
import { useMedals } from "@/context/medals-context";

export default function LegalPage() {
  const { isConnected } = useWallet();
  const { award } = useMedals();

  // Gatilho de visualização: destrava Fase PRO ao montar a página com carteira conectada
  useEffect(() => {
    if (isConnected) {
      award("pro_unlocked");
    }
  }, [isConnected, award]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 scroll-smooth">

      {/* HERO */}
      <div className="bg-slate-900 text-white pt-24 pb-16 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/4" />
        <div className="container mx-auto px-4 relative z-10">
          <Link
            href="/trail"
            className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-8 text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para a Trilha Lake
          </Link>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-900/50 border border-blue-700/50 mb-6">
            <ShieldCheck className="w-5 h-5 text-blue-400" />
            <span className="text-sm font-semibold tracking-wider uppercase text-blue-400">
              Fase PRO · Trilha Lake
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
            O &quot;Lastro&quot;{" "}
            <span className="text-blue-400">Jurídico</span>
          </h1>
          <p className="text-xl text-slate-400 max-w-2xl leading-relaxed">
            Código é Lei? Não. A Lei é a Lei. Nós unimos os dois.
          </p>
        </div>
      </div>

      {/* CONTEÚDO */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto space-y-8">

          {/* SEÇÃO 2: SEGURANÇA JURÍDICA */}
          <section id="juridico" className="space-y-6">
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-8 space-y-6">

              {/* O Token é o Espelho do Contrato */}
              <div className="flex gap-4 items-start">
                <FileText className="w-6 h-6 text-blue-600 mt-1 shrink-0" />
                <div>
                  <h3 className="text-xl font-bold text-slate-900">
                    O Token é o Espelho do Contrato
                  </h3>
                  <p className="text-slate-700 mt-2 leading-relaxed">
                    Para cada ativo listado na LakeTokeniza, existe uma
                    estrutura jurídica robusta no mundo real. Geralmente
                    utilizamos:
                  </p>
                  <ul className="list-disc ml-5 mt-3 space-y-2 text-slate-700">
                    <li>
                      <strong>CCB (Cédula de Crédito Bancário):</strong> Para
                      dívidas e recebíveis.
                    </li>
                    <li>
                      <strong>SPE (Sociedade de Propósito Específico):</strong>{" "}
                      Para projetos imobiliários.
                    </li>
                    <li>
                      <strong>Tokens de Recebíveis:</strong> Registrados
                      conforme normas da CVM.
                    </li>
                  </ul>
                </div>
              </div>

              {/* Garantia de Execução */}
              <div className="flex gap-4 items-start">
                <Landmark className="w-6 h-6 text-blue-600 mt-1 shrink-0" />
                <div>
                  <h3 className="text-xl font-bold text-slate-900">
                    Garantia de Execução
                  </h3>
                  <p className="text-slate-700 mt-2">
                    Se a plataforma sair do ar, se a internet cair, seu direito
                    de propriedade persiste. O Token serve como prova de
                    titularidade irrefutável para execução judicial se
                    necessário. Isso é segurança institucional.
                  </p>
                </div>
              </div>

            </div>
          </section>

          {/* CTA: Conclusão da Trilha */}
          <div className="bg-gradient-to-r from-blue-50 to-emerald-50 border border-blue-100 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p className="font-bold text-slate-900 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-500" />
                Parabéns — Trilha Concluída!
              </p>
              <p className="text-sm text-slate-500 mt-1">
                Você completou todas as fases da Trilha Lake. Volte ao
                dashboard para ver suas medalhas conquistadas.
              </p>
            </div>
            <Link
              href="/trail"
              className="shrink-0 inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition-colors"
            >
              Ver Minhas Medalhas
              <Trophy className="w-4 h-4" />
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}
