"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ShieldCheck,
  Fingerprint,
  User,
  Copy,
  Check,
  ExternalLink,
  Calendar,
  Hash,
  ArrowLeft,
  Stamp,
  Lock,
} from "lucide-react";
import { toast } from "sonner";

interface ArweaveMetadata {
  nickname: string;
  avatarUrl: string | null;
}

interface ProfileResponse {
  success: boolean;
  walletAddress: string;
  isCitizen: boolean;
  sbtImageUrl: string;
  createdAt: string;
  updatedAt: string;
}

export default function IdentityVisualizerPage() {
  const params = useParams();
  const router = useRouter();
  const txId = params?.txId as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [metadata, setMetadata] = useState<ArweaveMetadata | null>(null);
  const [copiedWallet, setCopiedWallet] = useState(false);
  const [copiedHash, setCopiedHash] = useState(false);

  useEffect(() => {
    if (!txId) return;

    async function fetchIdentityData() {
      try {
        setLoading(true);
        setError(null);

        // 1. Buscar dados do perfil na nossa API local
        const localProfileRes = await fetch(`/api/users/profile?txId=${txId}`);
        if (!localProfileRes.ok) {
          throw new Error("Perfil não encontrado no banco de dados local.");
        }
        const profileData: ProfileResponse = await localProfileRes.json();
        setProfile(profileData);

        // 2. Buscar o JSON bruto diretamente no Gateway Irys (Arweave Direct Viewer)
        const directUrl = `https://gateway.irys.xyz/${txId}`;
        const metadataRes = await fetch(directUrl);
        if (!metadataRes.ok) {
          throw new Error("Falha ao carregar metadados da camada Arweave/Irys.");
        }
        const metaData: ArweaveMetadata = await metadataRes.json();
        setMetadata(metaData);
      } catch (err: any) {
        console.error("[IdentityVisualizer] Erro ao carregar:", err);
        setError(err.message || "Erro desconhecido ao ler o registro.");
      } finally {
        setLoading(false);
      }
    }

    fetchIdentityData();
  }, [txId]);

  const copyToClipboard = async (text: string, setCopiedState: (v: boolean) => void) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedState(true);
      toast.success("Copiado para a área de transferência!");
      setTimeout(() => setCopiedState(false), 2000);
    } catch {
      toast.error("Falha ao copiar.");
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    } catch {
      return "Data indisponível";
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 md:p-8 relative overflow-hidden select-none">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-indigo-500/5 rounded-full blur-[80px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-64 h-64 bg-amber-500/5 rounded-full blur-[90px] pointer-events-none" />

      {/* Header / Back CTA */}
      <div className="w-full max-w-xl mb-6 relative z-10">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para a plataforma
        </button>
      </div>

      {loading && (
        <div className="w-full max-w-xl p-8 rounded-3xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl flex flex-col items-center justify-center gap-4 relative z-10 shadow-2xl">
          <div className="w-12 h-12 rounded-full border-4 border-indigo-500/30 border-t-indigo-500 animate-spin" />
          <p className="text-slate-400 font-medium">Buscando fé pública no cartório digital...</p>
        </div>
      )}

      {!loading && error && (
        <div className="w-full max-w-xl p-8 rounded-3xl bg-slate-900/60 border border-red-500/30 backdrop-blur-xl flex flex-col items-center text-center gap-4 relative z-10 shadow-2xl">
          <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-white">Falha na Verificação de Registro</h2>
          <p className="text-sm text-slate-400 max-w-md">{error}</p>
          <button
            onClick={() => router.push("/dashboard/investor")}
            className="mt-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 font-semibold text-sm transition-all"
          >
            Ir para a Dashboard
          </button>
        </div>
      )}

      {!loading && profile && metadata && (
        <div className="w-full max-w-xl relative z-10">
          {/* Main Card */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-amber-500/20 via-slate-900/90 to-slate-950 p-1 shadow-2xl shadow-amber-950/20 border border-slate-800/80">
            
            {/* Stamp watermark background */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.02] pointer-events-none">
              <Stamp className="w-96 h-96 text-amber-500" />
            </div>

            <div className="relative rounded-[22px] bg-slate-950/95 p-6 md:p-8 backdrop-blur-md">
              
              {/* Card Header */}
              <div className="flex items-center justify-between border-b border-slate-800/60 pb-6 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400/20 to-amber-600/15 border border-amber-500/30 flex items-center justify-center shadow-lg shadow-amber-500/5">
                    <Fingerprint className="w-5.5 h-5.5 text-amber-400" />
                  </div>
                  <div>
                    <h1 className="text-sm font-extrabold text-white tracking-widest uppercase">
                      Certidão de Registro
                    </h1>
                    <p className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">
                      Identidade Criptográfica
                    </p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-wider shadow-sm">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  AUTÊNTICA
                </span>
              </div>

              {/* Identity Content */}
              <div className="flex flex-col items-center text-center gap-4 mb-6">
                {/* Avatar frame */}
                <div className="relative">
                  <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 p-0.5 shadow-xl shadow-blue-500/10">
                    <div className="w-full h-full rounded-[14px] bg-slate-950 flex items-center justify-center overflow-hidden">
                      {metadata.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={metadata.avatarUrl}
                          alt={`Avatar de ${metadata.nickname}`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-10 h-10 text-slate-500" />
                      )}
                    </div>
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-lg bg-amber-500 border border-slate-950 flex items-center justify-center shadow">
                    <Stamp className="w-3.5 h-3.5 text-slate-950" />
                  </div>
                </div>

                {/* Nickname and Badges */}
                <div>
                  <h2 className="text-2xl font-black text-white tracking-tight">
                    {metadata.nickname}
                  </h2>
                  <p className="text-xs font-mono text-slate-400 mt-0.5">
                    {profile.isCitizen ? "Cidadão Oficial" : "Visitante Lake"}
                  </p>
                </div>
              </div>

              {/* Metadata Details Fields */}
              <div className="space-y-3.5 bg-slate-900/40 rounded-2xl border border-slate-800/40 p-4 md:p-5 mb-6 text-xs md:text-sm">
                {/* Wallet Owner */}
                <div className="flex justify-between items-center border-b border-slate-800/30 pb-3">
                  <span className="text-slate-400 font-semibold flex items-center gap-1.5 shrink-0">
                    <User className="w-3.5 h-3.5 text-indigo-400" />
                    Proprietário (Wallet)
                  </span>
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-mono text-slate-200 truncate max-w-[150px] sm:max-w-xs text-xs">
                      {profile.walletAddress}
                    </span>
                    <button
                      onClick={() => copyToClipboard(profile.walletAddress, setCopiedWallet)}
                      className="p-1 rounded bg-slate-800 hover:bg-slate-700 transition-colors shrink-0"
                      title="Copiar endereço completo"
                    >
                      {copiedWallet ? (
                        <Check className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Copy className="w-3 h-3 text-slate-400" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Registration Date */}
                <div className="flex justify-between items-center border-b border-slate-800/30 pb-3">
                  <span className="text-slate-400 font-semibold flex items-center gap-1.5 shrink-0">
                    <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                    Cunhagem do Dado
                  </span>
                  <span className="font-medium text-slate-200 text-xs">
                    {formatDate(profile.createdAt)}
                  </span>
                </div>

                {/* Arweave Hash */}
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-semibold flex items-center gap-1.5 shrink-0">
                    <Hash className="w-3.5 h-3.5 text-indigo-400" />
                    Transaction Hash (ID)
                  </span>
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-mono text-slate-200 truncate max-w-[120px] sm:max-w-[200px] text-xs">
                      {txId}
                    </span>
                    <button
                      onClick={() => copyToClipboard(txId, setCopiedHash)}
                      className="p-1 rounded bg-slate-800 hover:bg-slate-700 transition-colors shrink-0"
                      title="Copiar hash de preservação"
                    >
                      {copiedHash ? (
                        <Check className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Copy className="w-3 h-3 text-slate-400" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Message of Trust */}
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center shadow-inner mb-6">
                <p className="text-[11.5px] leading-relaxed text-amber-300 font-medium">
                  Identidade Registrada e Verificada na Camada de Preservação Arweave{" "}
                  <span className="font-bold">(rede simulada)</span>. Faça UpGrade e
                  Torne-se um Cidadão Lake e vamos juntos tokenizar o mundo!
                </p>
              </div>

              {/* Source of Truth Links Footer */}
              <div className="border-t border-slate-800/60 pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-[10px] text-slate-500">
                <span className="font-semibold uppercase tracking-wider">
                  Fonte da Verdade (Arweave)
                </span>
                <div className="flex items-center gap-3">
                  <a
                    href={`https://gateway.irys.xyz/${txId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 hover:text-indigo-400 transition-colors text-slate-400 font-bold"
                  >
                    JSON Original
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  <span className="text-slate-800">|</span>
                  <a
                    href={metadata.avatarUrl || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 hover:text-indigo-400 transition-colors text-slate-400 font-bold"
                    title="Visualizar prova visual original na camada Arweave"
                  >
                    Explorer Gateway
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
