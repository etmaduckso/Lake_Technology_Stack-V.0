"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Globe, ArrowLeft, ExternalLink } from "lucide-react";
import { useWallet } from "@/context/wallet-context";
import { useMedals } from "@/context/medals-context";

export default function FundamentalsPage() {
  const { isConnected } = useWallet();
  const { award } = useMedals();

  // Gatilho de visualização: destrava Fase 1 ao montar a página com carteira conectada
  useEffect(() => {
    if (isConnected) {
      award("rwa_intro_read");
    }
  }, [isConnected, award]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 scroll-smooth">

      {/* HERO */}
      <div className="bg-slate-900 text-white pt-24 pb-16 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-emerald-500/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/4" />
        <div className="container mx-auto px-4 relative z-10">
          <Link
            href="/trail"
            className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-8 text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para a Trilha Lake
          </Link>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-900/50 border border-emerald-700/50 mb-6">
            <Globe className="w-5 h-5 text-emerald-400" />
            <span className="text-sm font-semibold tracking-wider uppercase text-emerald-400">
              Fase 1 · Trilha Lake
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
            A Revolução{" "}
            <span className="text-emerald-400">RWA</span>
          </h1>
          <p className="text-xl text-slate-400 max-w-2xl leading-relaxed">
            Por que a BlackRock chama isso de &quot;A próxima geração de mercados&quot;.
          </p>
        </div>
      </div>

      {/* CONTEÚDO */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto space-y-8">

          {/* SEÇÃO 1: RWA */}
          <section id="intro-rwa" className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
              <div className="prose prose-lg text-slate-600 max-w-none">
                <p>
                  <strong>
                    Imagine poder comprar um pedaço de um prédio na Faria Lima
                    ou de uma fazenda de soja no Mato Grosso com a mesma
                    facilidade que envia um e-mail.
                  </strong>
                </p>
                <p>
                  Ativos do Mundo Real (RWA) são a ponte definitiva entre o
                  mercado financeiro tradicional (Web2) e a Blockchain (Web3).
                  Não estamos falando de moedas meme ou especulação vazia.
                  Estamos falando de colocar ativos de trilhões de dólares —
                  Imóveis, Agronegócio, Crédito Privado — dentro da segurança
                  da Blockchain.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-6 mt-8">
                <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 shadow-sm">
                  <h4 className="font-bold text-slate-900 mb-2">🏦 Fracionamento</h4>
                  <p className="text-sm text-slate-600">
                    Um imóvel de R$ 10 milhões é inacessível. Tokenizado, ele
                    vira 1 milhão de pedaços de R$ 10,00. Qualquer um pode
                    investir.
                  </p>
                </div>
                <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 shadow-sm">
                  <h4 className="font-bold text-slate-900 mb-2">🌎 Liquidez Global 24/7</h4>
                  <p className="text-sm text-slate-600">
                    O mercado tradicional fecha às 17h e não funciona no fim de
                    semana. A Blockchain nunca dorme. Venda seus ativos domingo
                    às 3h da manhã.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* CTA: próximo passo */}
          <div className="bg-gradient-to-r from-emerald-50 to-purple-50 border border-emerald-100 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p className="font-bold text-slate-900">Próximo passo da Trilha</p>
              <p className="text-sm text-slate-500 mt-1">
                Agora que você entende o que são RWAs, aprenda a instalar sua
                carteira Solana para começar a operar.
              </p>
            </div>
            <Link
              href="/trail/wallet"
              className="shrink-0 inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-purple-600 text-white font-bold hover:bg-purple-700 transition-colors"
            >
              Fase 2 · Sua Carteira
              <ExternalLink className="w-4 h-4" />
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}
