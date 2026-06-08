"use client";

import { useEffect } from "react";
import Link from "next/link";
import {
  Fingerprint,
  Ghost,
  UserCheck,
  ArrowLeft,
  ExternalLink,
} from "lucide-react";
import { useWallet } from "@/context/wallet-context";
import { useMedals } from "@/context/medals-context";

export default function IdentityPage() {
  const { isConnected } = useWallet();
  const { award } = useMedals();

  // Gatilho de visualização: destrava Fase 4 ao montar a página com carteira conectada
  useEffect(() => {
    if (isConnected) {
      award("asset_browsed");
    }
  }, [isConnected, award]);
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 scroll-smooth">

      {/* HERO */}
      <div className="bg-slate-900 text-white pt-24 pb-16 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-cyan-500/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/4" />
        <div className="container mx-auto px-4 relative z-10">
          <Link
            href="/trail"
            className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-8 text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para a Trilha Lake
          </Link>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-900/50 border border-cyan-700/50 mb-6">
            <Fingerprint className="w-5 h-5 text-cyan-400" />
            <span className="text-sm font-semibold tracking-wider uppercase text-cyan-400">
              Fase 4 · Trilha Lake
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
            Identidade:{" "}
            <span className="text-cyan-400">O &quot;Código Estranho&quot;</span>
          </h1>
          <p className="text-xl text-slate-400 max-w-2xl leading-relaxed">
            Por que usamos 0x71... em vez do seu Nome ou CPF?
          </p>
        </div>
      </div>

      {/* CONTEÚDO */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto space-y-8">

          {/* SEÇÃO IDENTIDADE & PRIVACIDADE */}
          <section id="identity" className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
              <div className="prose prose-lg text-slate-600 max-w-none mb-8">
                <p>
                  Muitos usuários se assustam ao ver um código como{" "}
                  <code>0x71C...9A2</code>. Parece um erro de computador, mas
                  na verdade é a sua{" "}
                  <strong>Blindagem de Privacidade</strong>.
                </p>
                <p>
                  Pense nisso como uma &quot;Conta Suíça Numerada&quot;. O sistema sabe
                  que a conta existe e é válida, mas não precisa saber quem é o
                  dono para deixar você operar. Isso garante que seus dados não
                  vazem em ataques hackers.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-0 border border-slate-200 rounded-xl overflow-hidden">
                {/* Lado P2P */}
                <div className="bg-slate-50 p-6 border-b md:border-b-0 md:border-r border-slate-200">
                  <div className="flex items-center gap-2 mb-4">
                    <Ghost className="w-6 h-6 text-slate-600" />
                    <h3 className="font-bold text-lg text-slate-900">
                      Modo P2P (Liberdade)
                    </h3>
                  </div>
                  <p className="text-sm text-slate-600 mb-4 min-h-[40px]">
                    Para trocas de créditos, tokens de utilidade e serviços
                    digitais peer-to-peer.
                  </p>
                  <ul className="space-y-2 text-sm text-slate-600">
                    <li className="flex gap-2">
                      ✅ <strong>Login:</strong> Apenas Carteira (0x...)
                    </li>
                    <li className="flex gap-2">
                      ✅ <strong>Dados:</strong> Zero Exposição
                    </li>
                    <li className="flex gap-2">
                      ✅ <strong>Velocidade:</strong> Instantânea
                    </li>
                  </ul>
                </div>

                {/* Lado KYC */}
                <div className="bg-blue-50/50 p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <UserCheck className="w-6 h-6 text-blue-600" />
                    <h3 className="font-bold text-lg text-slate-900">
                      Modo Investidor (RWA)
                    </h3>
                  </div>
                  <p className="text-sm text-slate-600 mb-4 min-h-[40px]">
                    Para comprar Imóveis ou Títulos de Dívida (Exigência da
                    Lei/CVM).
                  </p>
                  <ul className="space-y-2 text-sm text-slate-600">
                    <li className="flex gap-2">
                      🛡️ <strong>Login:</strong> Carteira + LakeID
                    </li>
                    <li className="flex gap-2">
                      🛡️ <strong>Dados:</strong> KYC (Validação de Doc)
                    </li>
                    <li className="flex gap-2">
                      🛡️ <strong>Segurança:</strong> Proteção Legal Completa
                    </li>
                  </ul>
                </div>
              </div>

              <p className="text-center text-xs text-slate-400 mt-4">
                Na LakeTokeniza, você escolhe como quer operar. Privacidade
                quando possível, Identificação quando necessário.
              </p>
            </div>
          </section>

          {/* CTA: próximo passo */}
          <div className="bg-gradient-to-r from-cyan-50 to-yellow-50 border border-cyan-100 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p className="font-bold text-slate-900">Próximo passo da Trilha</p>
              <p className="text-sm text-slate-500 mt-1">
                Com sua identidade blindada, entenda como funcionam as taxas da
                rede Solana e como a nossa arquitetura elimina essa barreira para
                você.
              </p>
            </div>
            <Link
              href="/trail/investor"
              className="shrink-0 inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-yellow-600 text-white font-bold hover:bg-yellow-700 transition-colors"
            >
              Fase 5 · Mecânica da Rede
              <ExternalLink className="w-4 h-4" />
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}
