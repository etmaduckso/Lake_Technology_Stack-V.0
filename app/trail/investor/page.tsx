"use client";

import Link from "next/link";
import { Cpu, Zap, Lock, Coins, ArrowLeft, ExternalLink, Fuel, CheckCircle2 } from "lucide-react";
import { useWallet } from "@/context/wallet-context";
import { useMedals } from "@/context/medals-context";

export default function InvestorPage() {
  const { isConnected } = useWallet();
  const { isEarned } = useMedals();

  // Smart CTA: detecta se o usuário já completou a Fase 5
  const fase5Completa = isConnected && isEarned("fase-5-tokenizador");

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 scroll-smooth">

      {/* HERO */}
      <div className="bg-slate-900 text-white pt-24 pb-16 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-yellow-500/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/4" />
        <div className="container mx-auto px-4 relative z-10">
          <Link
            href="/trail"
            className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-8 text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para a Trilha Lake
          </Link>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-900/50 border border-yellow-700/50 mb-6">
            <Cpu className="w-5 h-5 text-yellow-400" />
            <span className="text-sm font-semibold tracking-wider uppercase text-yellow-400">
              Fase 5 · Trilha Lake
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
            A Mecânica da Rede:{" "}
            <span className="text-yellow-400">Gas, Taxas e Sustentabilidade</span>
          </h1>
          <p className="text-xl text-slate-400 max-w-2xl leading-relaxed">
            Entenda por que o SOL que você resgatou no Faucet é necessário — e
            como a arquitetura LakeZero™ elimina essa barreira para você.
          </p>
        </div>
      </div>

      {/* CONTEÚDO */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto space-y-8">

          <section id="lakezero" className="space-y-6">

            {/* Bloco 1: O que são as taxas de rede? */}
            <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm space-y-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Fuel className="w-6 h-6 text-orange-600" />
                </div>
                <h2 className="text-xl font-bold text-slate-800">
                  Por que preciso de SOL para operar?
                </h2>
              </div>
              <p className="text-slate-600 leading-relaxed">
                Toda operação em uma blockchain — criar um token, transferir
                fundos, registrar um ativo — precisa ser processada por uma rede
                de computadores distribuídos ao redor do mundo. Esses
                computadores cobram uma pequena taxa em SOL pelo processamento.
                Chamamos isso de <strong>taxa de rede</strong> (ou{" "}
                <em>&quot;gas fee&quot;</em> em outras redes).
              </p>
              <p className="text-slate-600 leading-relaxed">
                É por isso que na <strong>Fase 3</strong> você resgatou 0.05 SOL
                do LakeFaucet: esse saldo cobre as taxas das suas operações de
                teste na Devnet. Na rede principal (Mainnet), você usaria SOL
                real — mas a mecânica é idêntica.
              </p>
            </div>

            {/* Bloco 2: Card escuro — Off-Chain Speed + On-Chain Settlement + Taxa */}
            <div className="bg-slate-900 text-white p-8 rounded-2xl">
              <h3 className="text-lg font-bold text-emerald-400 mb-6">
                Como a LakeZero™ resolve esse problema
              </h3>
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h4 className="text-emerald-400 font-bold text-lg mb-2 flex items-center gap-2">
                    <Zap className="w-5 h-5" /> Off-Chain Speed
                  </h4>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    Todas as ordens de compra, venda e troca dentro da
                    plataforma acontecem em nossos servidores seguros (Rust),
                    sem tocar na blockchain a cada clique.{" "}
                    <strong>Custo de Gas: ZERO. Velocidade: MILISSEGUNDOS.</strong>
                  </p>
                </div>
                <div>
                  <h4 className="text-emerald-400 font-bold text-lg mb-2 flex items-center gap-2">
                    <Lock className="w-5 h-5" /> On-Chain Settlement
                  </h4>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    Só no momento de liquidação final — quando a propriedade do
                    ativo muda de forma permanente — a transação é gravada na
                    Blockchain pública. Isso garante que ninguém (nem nós) possa
                    alterar o histórico final.
                  </p>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-slate-700">
                <div className="flex items-start gap-4">
                  <Coins className="w-6 h-6 text-yellow-400 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="font-bold text-white">
                      Taxa de Sustentabilidade ($0.30)
                    </h5>
                    <p className="text-slate-400 text-sm mt-1 leading-relaxed">
                      Manter servidores de alta performance, auditores de
                      segurança e parcerias jurídicas custa caro. Cobramos uma
                      taxa fixa simbólica para garantir que o sistema seja
                      sustentável, auditável e livre de censura. Parte dessa
                      taxa alimenta o <strong>Fundo de Liquidez</strong> do
                      protocolo, beneficiando todos os investidores.
                    </p>
                  </div>
                </div>
              </div>
            </div>

          </section>

          {/* SMART CTA: comportamento muda conforme estado da medalha */}
          {fase5Completa ? (
            /* Fase 5 já concluída → redireciona para Fase 6 */
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <p className="font-bold text-emerald-800 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  Fase 5 Concluída!
                </p>
                <p className="text-sm text-slate-500 mt-1">
                  Você já forjou seu primeiro ativo na blockchain. Avance para o
                  Compliance Jurídico e conclua a Trilha.
                </p>
              </div>
              <Link
                href="/trail/legal"
                className="shrink-0 inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition-colors whitespace-nowrap"
              >
                Fase 6 · Compliance
                <ExternalLink className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            /* Fase 5 pendente → vai para o simulador */
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <p className="font-bold text-slate-900">Próximo passo da Trilha</p>
                <p className="text-sm text-slate-500 mt-1">
                  Agora que você entende como a rede funciona, coloque a mão na
                  massa. Gaste seu SOL de teste e forje um ativo real na
                  blockchain.
                </p>
              </div>
              <Link
                href="/tokenize"
                className="shrink-0 inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-orange-600 text-white font-bold hover:bg-orange-700 transition-colors whitespace-nowrap"
              >
                Simular Tokenização (Prática)
                <ExternalLink className="w-4 h-4" />
              </Link>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
