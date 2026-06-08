"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Wallet,
  Key,
  ExternalLink,
  ArrowLeft,
  WalletMinimal,
  CheckCircle2,
  Loader2,
  ShieldAlert,
} from "lucide-react";
// Importamos o hook DIRETO do Solana Adapter para máxima reatividade,
// sem passar pelo wrapper do wallet-context (evita closure stale).
import { useWallet as useSolanaWallet } from "@solana/wallet-adapter-react";
// Mantemos o useWallet do contexto para o connectWallet (abre o modal)
import { useWallet } from "@/context/wallet-context";
import { useMedals } from "@/context/medals-context";

export default function WalletMasterclassPage() {
  // Estado de hydration (Client-Side Boundary): garante que o render condicional
  // da wallet só ocorra no cliente, evitando mismatch SSR/CSR.
  const [isClient, setIsClient] = useState(false);
  useEffect(() => { setIsClient(true); }, []);

  // Fonte primária de reatividade: hook direto do Solana Wallet Adapter.
  // Muda no milissegundo em que o popup aprova a conexão.
  const { connected, publicKey } = useSolanaWallet();

  // connectWallet do contexto — abre o modal da Solana UI
  const { connectWallet } = useWallet();

  // Gatilho de medalha Fase 2: dispara ao detectar conexão
  const { award } = useMedals();
  useEffect(() => {
    if (isClient && connected && publicKey) {
      award("wallet_connected");
    }
  }, [isClient, connected, publicKey, award]);

  const walletAddress = publicKey ? publicKey.toBase58() : null;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 scroll-smooth">

      {/* HERO */}
      <div className="bg-slate-900 text-white pt-24 pb-16 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/4" />
        <div className="container mx-auto px-4 relative z-10">
          <Link
            href="/trail"
            className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-8 text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para a Trilha Lake
          </Link>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-900/50 border border-purple-700/50 mb-6">
            <Wallet className="w-5 h-5 text-purple-400" />
            <span className="text-sm font-semibold tracking-wider uppercase text-purple-400">
              Fase 2 · Trilha Lake
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
            Masterclass:{" "}
            <span className="text-purple-400">Carteiras Digitais</span>
          </h1>
          <p className="text-xl text-slate-400 max-w-2xl leading-relaxed">
            Se você não tem a chave, o dinheiro não é seu.
          </p>
        </div>
      </div>

      {/* CONTEÚDO */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto">

          <section id="wallet-masterclass" className="space-y-8">

            {/* Conceito: O Cofre de Vidro */}
            <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm space-y-8">
              <div className="flex flex-col md:flex-row gap-8 items-center">
                <div className="flex-1 space-y-4">
                  <h2 className="text-2xl font-bold text-slate-800">
                    O Cofre de Vidro
                  </h2>
                  <p className="text-slate-600 leading-relaxed">
                    Pense na Blockchain como um cofre de vidro gigante na praça
                    da cidade. Todos podem ver quanto dinheiro tem em cada caixa,
                    mas ninguém pode tocar. A sua{" "}
                    <strong>Wallet</strong> guarda a{" "}
                    <strong>CHAVE</strong> que abre a sua caixa.
                  </p>
                </div>
                <div className="bg-purple-50 p-6 rounded-xl border border-purple-100 w-full md:w-1/3 text-center">
                  <Key className="w-12 h-12 text-purple-500 mx-auto mb-3" />
                  <div className="font-bold text-purple-900">
                    As Chaves da sua Caixa Forte
                  </div>
                  <p className="text-xs text-purple-700 mt-2">
                    Ao criar a carteira, você recebe 12 palavras (Semente - sua chave mestra). Ao exportar uma conta específica, verá um código longo (Chave Privada Base58). Ambas dão acesso total aos seus ativos. NUNCA digite ou compartilhe esses dados em sites suspeitos.
                  </p>
                </div>
              </div>

              {/* Tutorial de Instalação */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-slate-800">
                  Tutorial de Instalação (Recomendado para Solana)
                </h3>
                <div className="grid md:grid-cols-2 gap-4">

                  {/* Phantom */}
                  <Link
                    href="https://phantom.com/learn/guides/how-to-create-a-new-wallet"
                    target="_blank"
                    className="flex items-center gap-4 p-4 border border-slate-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all group"
                  >
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center font-bold text-blue-600 shrink-0">
                      1
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-slate-900 group-hover:text-blue-700">
                        Phantom Wallet (A Favorita)
                      </div>
                      <div className="text-xs text-slate-500">
                        O padrão da indústria na Solana. Interface impecável e
                        super segura.
                      </div>
                      <div className="text-xs text-amber-600 font-medium mt-1">
                        Dica: Siga este tutorial oficial com o passo a passo da instalação e criação da semente.
                      </div>
                    </div>
                    <ExternalLink className="w-4 h-4 text-slate-400 shrink-0" />
                  </Link>

                  {/* Solflare */}
                  <Link
                    href="https://www.solflare.com/guides/how-to-set-up-your-first-crypto-wallet-with-solflare-step-by-step/"
                    target="_blank"
                    className="flex items-center gap-4 p-4 border border-slate-200 rounded-xl hover:border-orange-500 hover:bg-orange-50 transition-all group"
                  >
                    <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center font-bold text-orange-600 shrink-0">
                      2
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-slate-900 group-hover:text-orange-700">
                        Solflare (Institucional)
                      </div>
                      <div className="text-xs text-slate-500">
                        Focada em segurança avançada, ideal para quem vai
                        investir em RWA pesados.
                      </div>
                      <div className="text-xs text-amber-600 font-medium mt-1">
                        Dica: Siga este guia oficial passo a passo para configurar sua carteira web ou mobile.
                      </div>
                    </div>
                    <ExternalLink className="w-4 h-4 text-slate-400 shrink-0" />
                  </Link>

                </div>
              </div>
            </div>

            {/* ═══════════════════════════════════════════════════════════════
                MANUAL DE SOBREVIVÊNCIA WEB3 — Bloco educacional de segurança
                Inserido após os cards de instalação, antes do status de conexão
            ═══════════════════════════════════════════════════════════════ */}
            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-6 space-y-5">

              {/* Título */}
              <div className="flex items-start gap-3">
                <div className="p-2 bg-amber-100 rounded-lg shrink-0 mt-0.5">
                  <ShieldAlert className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-lg leading-tight">
                    Manual de Sobrevivência Web3: Quem guarda a chave?
                  </h3>
                  <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                    A <strong>LakeTokeniza apenas lê seu endereço público</strong> —
                    não tem acesso à sua chave privada e nunca pode assinar transações
                    por você. A autorização real de qualquer operação fica{" "}
                    <strong>trancada dentro da extensão do seu navegador</strong>. Se
                    você se afastar do computador com a extensão desbloqueada, qualquer
                    pessoa próxima pode assinar transações em seu nome.
                  </p>
                </div>
              </div>

              {/* Divisor */}
              <div className="border-t border-amber-500/20" />

              {/* Passo a passo */}
              <div>
                <p className="text-xs font-bold text-amber-700 uppercase tracking-widest mb-3">
                  Como configurar o bloqueio automático (Auto-Lock)
                </p>
                <ol className="space-y-3">

                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-amber-500 text-white text-xs font-extrabold flex items-center justify-center shrink-0 mt-0.5">
                      1
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">
                        Abra a extensão da sua carteira
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Clique no ícone da Phantom ou Solflare na barra de extensões do navegador.
                      </p>
                    </div>
                  </li>

                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-amber-500 text-white text-xs font-extrabold flex items-center justify-center shrink-0 mt-0.5">
                      2
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">
                        Vá em Configurações
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Procure o ícone de engrenagem (⚙️) geralmente no canto superior direito ou no menu principal da extensão.
                      </p>
                    </div>
                  </li>

                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-amber-500 text-white text-xs font-extrabold flex items-center justify-center shrink-0 mt-0.5">
                      3
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">
                        Acesse &quot;Segurança e Privacidade&quot;
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Procure pela seção <em>Security &amp; Privacy</em> (ou &quot;Segurança e Privacidade&quot; na versão em português).
                      </p>
                    </div>
                  </li>

                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-amber-600 text-white text-xs font-extrabold flex items-center justify-center shrink-0 mt-0.5">
                      4
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">
                        Ative o &quot;Bloqueio Automático&quot; (Auto-Lock Timer)
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Configure para <strong>15 ou 30 minutos</strong>. Após o período de inatividade, a
                        extensão solicitará sua senha antes de assinar qualquer transação.
                      </p>
                    </div>
                  </li>

                </ol>
              </div>

              {/* Rodapé de aviso */}
              <div className="flex items-center gap-2 pt-1">
                <div className="h-px flex-1 bg-amber-500/20" />
                <p className="text-xs text-amber-700 font-semibold px-2">
                  🔐 Configuração recomendada antes de continuar a Trilha
                </p>
                <div className="h-px flex-1 bg-amber-500/20" />
              </div>

            </div>

            {/* STATUS DE CONEXÃO E CTA — Isolamento Estrito de Hydration (Client-Side Boundary) */}
            {!isClient ? (
              <div className="space-y-4">
                {/* Skeleton neutro para Status da Carteira */}
                <div className="flex items-center gap-3 p-4 bg-slate-100 border border-slate-200 rounded-xl text-sm animate-pulse">
                  <Loader2 className="w-5 h-5 text-slate-400 shrink-0 animate-spin" />
                  <p className="text-slate-400">Verificando carteira...</p>
                </div>
                {/* Skeleton para CTA de Próximo Passo */}
                <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-100 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div>
                    <p className="font-bold text-slate-900 animate-pulse bg-slate-200 h-5 w-44 rounded" />
                    <p className="text-sm text-slate-500 animate-pulse bg-slate-200 h-4 w-64 rounded mt-2" />
                  </div>
                  <div className="shrink-0 px-6 py-3 rounded-xl bg-slate-200 w-40 h-11 animate-pulse" />
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* STATUS DE CONEXÃO REAL */}
                {connected && walletAddress ? (
                  <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-sm">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <div>
                      <span className="font-bold text-emerald-800">Carteira conectada: </span>
                      <span className="font-mono text-emerald-700 text-xs">
                        {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm">
                    <WalletMinimal className="w-5 h-5 text-amber-600 shrink-0" />
                    <p className="text-amber-800">
                      <strong>Conecte sua carteira</strong> para liberar o próximo passo da Trilha.
                      Instale a Phantom ou Solflare acima e clique em &quot;Conectar&quot; no canto superior da tela.
                    </p>
                  </div>
                )}

                {/* CTA: GUARD DE CONEXÃO REAL */}
                <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-100 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div>
                    <p className="font-bold text-slate-900">Próximo passo da Trilha</p>
                    <p className="text-sm text-slate-500 mt-1">
                      {connected
                        ? "Carteira detectada! Resgate seus primeiros SOL de teste."
                        : "Conecte uma carteira Solana para liberar esta etapa."}
                    </p>
                  </div>

                  {connected ? (
                    <Link
                      href="/trail/faucet"
                      className="shrink-0 inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-colors"
                    >
                      Fase 3 · LakeFaucet
                      <ExternalLink className="w-4 h-4" />
                    </Link>
                  ) : (
                    <button
                      onClick={connectWallet}
                      className="shrink-0 inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-purple-600 text-white font-bold hover:bg-purple-700 transition-colors"
                    >
                      <WalletMinimal className="w-4 h-4" />
                      Conectar Carteira
                    </button>
                  )}
                </div>
              </div>
            )}

          </section>
        </div>
      </div>
    </div>
  );
}
