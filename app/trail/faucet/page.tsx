"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
// Hook DIRETO do Solana Adapter — máxima reatividade, sem stale closure
import { useWallet as useSolanaWallet } from "@solana/wallet-adapter-react";
import { useWallet } from "@/context/wallet-context";
import { useMedals } from "@/context/medals-context";
import {
  Coins,
  Droplets,
  ExternalLink,
  Loader2,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  WalletMinimal,
  Lock,
  ShieldAlert,
} from "lucide-react";

function Pickaxe(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14.5 2L22 9.5" />
      <path d="M4.68 12.32a3 3 0 0 0 4.24 4.24l7.64-7.64a3 3 0 0 0-4.24-4.24l-7.64 7.64z" />
      <path d="m9.62 17.26-6.68 6.68a2 2 0 0 1-2.72-2.95l6.46-6.47" />
    </svg>
  );
}

type ClaimStatus = "idle" | "checking" | "available" | "already_claimed";

export default function FaucetPage() {
  // ── Hydration guard ──────────────────────────────────────────────────────
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  // ── Wallet state — fonte direta do adapter (reatividade imediata) ─────────
  const { connected, publicKey } = useSolanaWallet();
  const { connectWallet } = useWallet();

  // Valores seguros pós-hydration
  const isConnected = mounted && connected;
  const walletAddress = mounted && publicKey ? publicKey.toBase58() : null;

  // ── Medalhas ─────────────────────────────────────────────────────────────
  const { award, isEarned } = useMedals();
  const fase3Earned = isEarned("fase-3-faucet");

  // ── Estado do faucet ─────────────────────────────────────────────────────
  const [claimStatus, setClaimStatus] = useState<ClaimStatus>("idle");
  const [recipientAddress, setRecipientAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [txSignature, setTxSignature] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Preenche automaticamente ao detectar carteira
  useEffect(() => {
    if (walletAddress) {
      setRecipientAddress(walletAddress);
    } else {
      setRecipientAddress("");
      setClaimStatus("idle");
    }
  }, [walletAddress]);

  // ── VERIFICAÇÃO DE HISTÓRICO AO CONECTAR ─────────────────────────────────
  // Combina duas fontes de verdade para robustez máxima:
  //   1. GET /api/faucet?wallet=... (in-memory, reseta em restart)
  //   2. Medalha "fase-3-faucet" via isEarned() (persistida no banco)
  useEffect(() => {
    if (!isConnected || !walletAddress) return;

    // Se já tem a medalha (persistida), não precisa checar a API
    if (fase3Earned) {
      setClaimStatus("already_claimed");
      return;
    }

    let cancelled = false;
    setClaimStatus("checking");

    fetch(`/api/faucet?wallet=${encodeURIComponent(walletAddress)}`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        setClaimStatus(data.alreadyClaimed ? "already_claimed" : "available");
      })
      .catch(() => {
        if (!cancelled) setClaimStatus("available"); // fallback: permite tentar
      });

    return () => { cancelled = true; };
  }, [isConnected, walletAddress, fase3Earned]);

  // ── AIRDROP ───────────────────────────────────────────────────────────────
  const handleRequestFaucet = async () => {
    if (!recipientAddress || !isConnected || claimStatus !== "available") return;
    setLoading(true);
    setTxSignature(null);
    setErrorMsg(null);

    try {
      const response = await fetch("/api/faucet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress: recipientAddress }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Se o servidor retornar alreadyClaimed, atualiza o estado local
        if (data.alreadyClaimed) setClaimStatus("already_claimed");
        throw new Error(data.error || "Falha ao solicitar fundos.");
      }

      setTxSignature(data.signature);
      setClaimStatus("already_claimed");

      // Dispara medalha Fase 3
      await award("faucet_claimed");
    } catch (err: any) {
      console.error("[Faucet Request Error]", err);
      setErrorMsg(err.message || "Erro desconhecido ao acionar o LakeFaucet.");
    } finally {
      setLoading(false);
    }
  };

  // CTA de próximo passo liberado se:
  //   - já tinha a medalha (fase3Earned), OU
  //   - acaba de resgatar com sucesso (txSignature), OU
  //   - já tinha resgatado antes (already_claimed + sem txSignature = sessão anterior)
  const canAdvance =
    isConnected &&
    (fase3Earned || !!txSignature || claimStatus === "already_claimed");

  // ── RENDER ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 scroll-smooth">

      {/* HERO */}
      <div className="bg-slate-900 text-white pt-24 pb-16 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/4" />
        <div className="container mx-auto px-4 relative z-10">
          <Link
            href="/trail"
            className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-8 text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para a Trilha Lake
          </Link>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-900/50 border border-indigo-700/50 mb-6">
            <Coins className="w-5 h-5 text-indigo-400" />
            <span className="text-sm font-semibold tracking-wider uppercase text-indigo-400">
              Fase 3 · Trilha Lake
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
            Faucets:{" "}
            <span className="text-indigo-400">Dinheiro de Teste</span>
          </h1>
          <p className="text-xl text-slate-400 max-w-2xl leading-relaxed">
            Como conseguir &quot;Devnet SOL&quot; de forma imediata e simplificada para
            simular na plataforma.
          </p>
        </div>
      </div>

      {/* CONTEÚDO */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto space-y-8">

          {/* ── GUARD: sem carteira ── */}
          {!mounted || !isConnected ? (
            <div className="bg-white rounded-2xl border-2 border-amber-200 p-10 shadow-sm text-center space-y-4">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto">
                <Lock className="w-8 h-8 text-amber-500" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">
                Carteira não detectada
              </h2>
              <p className="text-slate-500 max-w-md mx-auto text-sm">
                Para acessar o LakeFaucet e resgatar SOL de teste, você precisa
                conectar uma carteira Solana (Phantom ou Solflare) primeiro.
              </p>
              {mounted && (
                <button
                  onClick={connectWallet}
                  className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-colors"
                >
                  <WalletMinimal className="w-4 h-4" />
                  Conectar Carteira
                </button>
              )}
              <p className="text-xs text-slate-400">
                Não tem uma carteira?{" "}
                <Link href="/trail/wallet" className="text-purple-600 hover:underline font-medium">
                  Volte para a Fase 2
                </Link>{" "}
                e instale a Phantom ou Solflare.
              </p>
            </div>
          ) : (
            /* ── COM CARTEIRA: cards do faucet ── */
            <section id="faucets" className="space-y-6">
              <div className="grid md:grid-cols-2 gap-8">

                {/* CARD 1: LAKEFAUCET (INTERATIVO) */}
                <div className="bg-white p-8 rounded-2xl border-2 border-indigo-100 shadow-md relative overflow-hidden flex flex-col justify-between">
                  <div>
                    <h2 className="font-extrabold text-xl text-slate-900 mb-2 flex items-center gap-2">
                      <Droplets className="w-5 h-5 text-indigo-500" />
                      LakeFaucet Nativo (Recomendado)
                    </h2>
                    <p className="text-sm text-slate-500 mb-6">
                      Colete 0.05 SOL Devnet diretamente de nossa tesouraria
                      institucional com apenas um clique.{" "}
                      <strong>1 resgate único por carteira</strong> — protegido
                      por Tokenomics Guard.
                    </p>

                    <div className="space-y-4 mb-6">

                      {/* Verificando status */}
                      {claimStatus === "checking" && (
                        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-500 text-sm flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                          Verificando histórico da carteira...
                        </div>
                      )}

                      {/* Já resgatou — aviso permanente */}
                      {claimStatus === "already_claimed" && !txSignature && (
                        <div className="p-4 bg-blue-50 border-l-4 border-blue-400 rounded-r-xl text-blue-800 text-sm space-y-1">
                          <p className="font-bold flex items-center gap-1.5">
                            <ShieldAlert className="w-4 h-4 text-blue-500" />
                            Tokenomics Guard Ativo
                          </p>
                          <p className="text-xs leading-relaxed">
                            Esta carteira já resgatou seus 0.05 SOL de teste.
                            O limite é de <strong>1 resgate único por carteira</strong>.
                            O botão de próximo passo está liberado abaixo.
                          </p>
                        </div>
                      )}

                      {/* Input de endereço — só quando disponível */}
                      {claimStatus !== "already_claimed" && (
                        <div>
                          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                            Endereço de Destino (Solana Devnet)
                          </label>
                          <input
                            type="text"
                            className="w-full p-3 text-sm font-mono border rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                            placeholder="Ex: HHyZWCu..."
                            value={recipientAddress}
                            onChange={(e) => setRecipientAddress(e.target.value)}
                          />
                        </div>
                      )}

                      {/* Sucesso do airdrop desta sessão */}
                      {txSignature && (
                        <div className="p-4 bg-emerald-50 border-l-4 border-emerald-500 rounded-r-xl text-emerald-800 text-sm space-y-1 animate-in fade-in duration-200">
                          <p className="font-bold flex items-center gap-1.5">
                            <CheckCircle className="w-4 h-4 text-emerald-600" />
                            Transferência Realizada! (+0.05 SOL)
                          </p>
                          <p className="text-xs text-emerald-600 font-mono break-all leading-relaxed">
                            Signature: {txSignature}
                          </p>
                          <Link
                            href={`https://solscan.io/tx/${txSignature}?cluster=devnet`}
                            target="_blank"
                            className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:underline mt-1"
                          >
                            Ver no Solscan <ExternalLink className="w-3 h-3" />
                          </Link>
                        </div>
                      )}

                      {/* Erro */}
                      {errorMsg && (
                        <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-r-xl text-red-800 text-sm space-y-1 animate-in fade-in duration-200">
                          <p className="font-bold flex items-center gap-1.5">
                            <AlertCircle className="w-4 h-4 text-red-600" />
                            Falha ao Processar
                          </p>
                          <p className="text-xs leading-relaxed">{errorMsg}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Botão do faucet — permanentemente desabilitado se já resgatou */}
                  {claimStatus === "already_claimed" ? (
                    <button
                      disabled
                      className="w-full py-4 rounded-xl font-bold text-lg text-white bg-slate-300 cursor-not-allowed shadow-none flex items-center justify-center gap-2"
                    >
                      <CheckCircle className="w-5 h-5" />
                      0.05 SOL já coletados por esta carteira
                    </button>
                  ) : (
                    <button
                      onClick={handleRequestFaucet}
                      disabled={loading || !recipientAddress || claimStatus === "checking"}
                      className={`w-full py-4 rounded-xl font-bold text-lg text-white shadow-lg transition-all flex items-center justify-center gap-2 ${
                        loading || !recipientAddress || claimStatus === "checking"
                          ? "bg-indigo-300 cursor-not-allowed shadow-none"
                          : "bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98]"
                      }`}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Transferindo SOL...
                        </>
                      ) : claimStatus === "checking" ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Verificando elegibilidade...
                        </>
                      ) : (
                        "Coletar 0.05 SOL Nativo (LakeFaucet)"
                      )}
                    </button>
                  )}
                </div>

                {/* CARD 2: QUICKNODE FAUCET (FALLBACK) */}
                <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden flex flex-col justify-between group">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-30 transition-opacity">
                    <Pickaxe className="w-16 h-16 text-slate-800" />
                  </div>
                  <div>
                    <h2 className="font-extrabold text-xl text-slate-900 mb-2 flex items-center gap-2">
                      <ExternalLink className="w-5 h-5 text-slate-500" />
                      QuickNode Faucet (Plano B)
                    </h2>
                    <p className="text-sm text-slate-500 mb-6">
                      Se o nosso faucet nativo estiver temporariamente sem fundos
                      ou se você atingiu o limite, utilize a torneira de testes
                      externa oficial da QuickNode.
                    </p>
                    <ul className="text-sm text-slate-600 space-y-3 mb-8">
                      <li className="flex items-start gap-2">
                        <span className="w-5 h-5 bg-slate-100 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">1</span>
                        <span>Acesse a página externa de airdrop da QuickNode.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-5 h-5 bg-slate-100 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">2</span>
                        <span>Cole o endereço da sua carteira (NÃO exige login com GitHub).</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-5 h-5 bg-slate-100 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">3</span>
                        <span>Confirme e receba o SOL diretamente na sua carteira.</span>
                      </li>
                    </ul>
                  </div>
                  <Link
                    href="https://faucet.quicknode.com/solana/devnet"
                    target="_blank"
                    className="w-full text-center py-4 rounded-xl bg-slate-800 text-white font-bold hover:bg-slate-900 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow"
                  >
                    Ir para Faucet Externo (QuickNode)
                    <ExternalLink className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </section>
          )}

          {/* ── CTA: PRÓXIMO PASSO ── */}
          {canAdvance ? (
            <div className="bg-gradient-to-r from-emerald-50 to-cyan-50 border border-emerald-200 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <p className="font-bold text-slate-900 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-emerald-500" />
                  {txSignature ? "SOL de teste resgatado!" : "SOL de teste confirmado!"}
                </p>
                <p className="text-sm text-slate-500 mt-1">
                  Agora entenda como a identidade descentralizada protege seus
                  dados na plataforma.
                </p>
              </div>
              <Link
                href="/trail/identity"
                className="shrink-0 inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-cyan-600 text-white font-bold hover:bg-cyan-700 transition-colors"
              >
                Fase 4 · Identidade
                <ExternalLink className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <div className="bg-gradient-to-r from-slate-50 to-slate-100 border border-slate-200 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 opacity-60">
              <div>
                <p className="font-bold text-slate-500 flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  Próximo passo bloqueado
                </p>
                <p className="text-sm text-slate-400 mt-1">
                  {!isConnected
                    ? "Conecte sua carteira para desbloquear."
                    : "Complete o airdrop do LakeFaucet acima para liberar a Fase 4."}
                </p>
              </div>
              <button
                disabled
                className="shrink-0 inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-300 text-slate-500 font-bold cursor-not-allowed"
              >
                Fase 4 · Identidade
                <Lock className="w-4 h-4" />
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
