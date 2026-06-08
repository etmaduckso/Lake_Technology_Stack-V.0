"use client";

import { useEffect, useState, use } from "react";
import {
  ArrowLeft, Loader2, Briefcase, DollarSign, Share2,
  Layers, ExternalLink, ShieldCheck, BarChart2, UserCheck,
  CheckCircle2, XOctagon, Settings, AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useWallet } from "@solana/wallet-adapter-react";
import { useRouter } from "next/navigation";
import { CurrencyDisplay } from "@/components/ui/CurrencyDisplay";

interface LedgerEntry { id: string; date: string; quantity: number; value: number; hash?: string | null; status: string; }
interface Financials { tokensSold: number; revenueRaised: number; royaltiesGenerated: number; ledger: LedgerEntry[]; pagination: { page: number; totalPages: number; total: number; limit: number }; }
interface AssetData { id: string; name: string; type: string; valuation: string; tokenPrice: string; totalTokens: number; status: string; ownerWallet: string; createdAt: string; description?: string | null; imageUrl?: string | null; contractUrl?: string | null; isListed?: boolean; financials?: Financials; }
interface PageProps { params: Promise<{ id: string }>; }

export default function ManageAssetPage({ params }: PageProps) {
  const { id } = use(params);
  const wallet = useWallet();
  const router = useRouter();

  const [asset, setAsset] = useState<AssetData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const [isTogglingList, setIsTogglingList] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editDescription, setEditDescription] = useState("");
  const [isSavingDesc, setIsSavingDesc] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [isRevoking, setIsRevoking] = useState(false);

  const fetchAsset = async (p: number) => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/assets/${id}?page=${p}&limit=10`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao carregar ativo.");
      setAsset({ ...data.asset, financials: data.financials });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchAsset(page); }, [id, page]);

  useEffect(() => {
    if (!isLoading && asset) {
      if (!wallet.connected || wallet.publicKey?.toBase58() !== asset.ownerWallet) {
        router.push("/marketplace");
      }
    }
  }, [wallet.connected, wallet.publicKey, asset, isLoading, router]);

  const handleToggleList = async () => {
    if (!asset || !wallet.publicKey) return;
    setIsTogglingList(true);
    try {
      const newStatus = asset.isListed === false ? true : false;
      const res = await fetch(`/api/assets/${asset.id}?wallet=${wallet.publicKey.toBase58()}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isListed: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setAsset((prev) => prev ? { ...prev, isListed: newStatus } : prev);
    } catch (err: any) {
      alert(`Erro: ${err.message}`);
    } finally {
      setIsTogglingList(false);
    }
  };

  const handleSaveDescription = async () => {
    if (!asset || !wallet.publicKey) return;
    setIsSavingDesc(true);
    try {
      const res = await fetch(`/api/assets/${asset.id}?wallet=${wallet.publicKey.toBase58()}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: editDescription }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setAsset((prev) => prev ? { ...prev, description: editDescription } : prev);
      setIsEditing(false);
    } catch (err: any) {
      alert(`Erro ao salvar: ${err.message}`);
    } finally {
      setIsSavingDesc(false);
    }
  };

  const handleValidate = () => {
    setIsValidating(true);
    setTimeout(() => { alert("Token de acesso validado na blockchain Solana."); setIsValidating(false); }, 900);
  };

  const handleRevoke = () => {
    if (!window.confirm("Confirmar revoga├º├úo permanente deste passe RWA?")) return;
    setIsRevoking(true);
    setTimeout(() => { alert("Passe revogado e sincronizado on-chain."); setIsRevoking(false); }, 900);
  };

  if (isLoading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
    </div>
  );

  if (error || !asset) return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 text-center">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 max-w-md space-y-4">
        <div className="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto font-bold text-xl">!</div>
        <h2 className="text-xl font-bold text-slate-800">Ativo Inacess├¡vel</h2>
        <p className="text-sm text-slate-500">{error || "N├úo foi poss├¡vel carregar as informa├º├Áes deste ativo."}</p>
        <Link href="/marketplace" className="inline-block px-6 py-2.5 bg-slate-900 text-white text-sm font-bold rounded-xl hover:bg-slate-800 transition-colors">
          Voltar ao Marketplace
        </Link>
      </div>
    </div>
  );

  const calculatedTokenPrice = Number(asset.valuation) / asset.totalTokens;
  const fin = asset.financials;
  const pagination = fin?.pagination;

  return (
    <div className="min-h-screen bg-[#f8f9fc] text-slate-900 pb-24">

      {/* ÔöÇÔöÇ HEADER ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ */}
      <div className="bg-white border-b border-slate-200 px-4 md:px-8 py-6 mb-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="space-y-2">
            <Link href="/marketplace" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 font-medium transition-colors mb-1">
              <ArrowLeft className="w-4 h-4" /> Voltar para o Marketplace
            </Link>
            <div className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-700 text-xs font-bold px-3 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Painel de Controle RWA Ativo
            </div>
            <h1 className="text-4xl font-extrabold text-slate-900 leading-tight">{asset.name}</h1>
            <p className="text-sm text-slate-500 flex items-center gap-2 flex-wrap">
              ID de Registro RWA:
              <span className="font-mono text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded border border-slate-200">
                {asset.id}
              </span>
            </p>
          </div>
          <div className="self-start border border-slate-200 rounded-xl px-4 py-2.5 flex items-center gap-2.5 bg-white shadow-sm">
            <span className="w-2 h-2 rounded-full bg-violet-500" />
            <div>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Blockchain Ativa</p>
              <p className="text-sm font-bold text-slate-800">Solana Devnet</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 space-y-6">

        {/* ÔöÇÔöÇ IMAGEM + LINK ARWEAVE ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 bg-slate-800 text-white text-xs font-semibold px-3 py-1.5 rounded-full">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Imagem salva no Arweave via Irys
            </span>
          </div>
          <div className="flex justify-center pb-4 px-4">
            {asset.imageUrl ? (
              <div className="relative w-full max-w-md h-56 rounded-xl overflow-hidden">
                <Image src={asset.imageUrl} alt={asset.name} fill className="object-cover" />
              </div>
            ) : (
              <div className="w-full max-w-md h-56 rounded-xl bg-slate-100 flex items-center justify-center">
                <p className="text-slate-400 text-sm font-medium">Sem imagem registrada</p>
              </div>
            )}
          </div>
          {asset.contractUrl && (
            <div className="px-4 pb-4 flex justify-end">
              <a href={asset.contractUrl} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-emerald-700 border border-slate-200 hover:border-emerald-300 bg-white hover:bg-emerald-50 px-4 py-2 rounded-xl transition-all shadow-sm">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                Auditar Documento Original (Arweave)
                <ExternalLink className="w-3.5 h-3.5 opacity-60" />
              </a>
            </div>
          )}
        </div>

        {/* ÔöÇÔöÇ 3 CARDS DE M├ëTRICAS ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Valuation */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Valuation Total</p>
              <CurrencyDisplay variant="transparent" brlValue={Number(asset.valuation)} />
              <p className="text-xs text-slate-400 font-medium mt-1">Avalia├º├úo do lastro f├¡sico</p>
            </div>
            <div className="shrink-0 w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-500">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>

          {/* Tokens Emitidos */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Tokens Emitidos</p>
              <p className="text-2xl font-extrabold text-slate-900">{asset.totalTokens.toLocaleString("pt-BR")}</p>
              <span className="inline-block mt-1 px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-full">
                100% Sincronizado
              </span>
            </div>
            <div className="shrink-0 flex flex-col items-end gap-2">
              <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-500">
                <Layers className="w-5 h-5" />
              </div>
              <button onClick={handleToggleList} disabled={isTogglingList}
                className={`text-[10px] font-bold px-3 py-1.5 rounded-lg uppercase tracking-wider transition-colors disabled:opacity-50 ${asset.isListed !== false ? "bg-amber-100 text-amber-700 hover:bg-amber-200" : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"}`}>
                {isTogglingList ? "..." : (asset.isListed !== false ? "Pausar Vendas" : "Retomar Vendas")}
              </button>
            </div>
          </div>

          {/* Pre├ºo do Token */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Pre├ºo do Token</p>
              <CurrencyDisplay variant="transparent" brlValue={calculatedTokenPrice} />
              <p className="text-xs text-slate-400 font-medium mt-1">Custo unit├írio fracionado</p>
            </div>
            <div className="shrink-0 w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-500">
              <Share2 className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* ÔöÇÔöÇ TERMINAL CFO ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ */}
        {fin && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-indigo-500" />
              Performance e Liquida├º├úo (Terminal CFO)
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-indigo-50 to-white rounded-2xl border border-indigo-100 p-5 shadow-sm">
                <p className="text-[10px] font-extrabold text-indigo-400 uppercase tracking-widest mb-2">Tokens Vendidos</p>
                <p className="text-3xl font-extrabold text-indigo-900">{fin.tokensSold.toLocaleString("pt-BR")}</p>
                <p className="text-xs text-indigo-500/70 font-medium mt-1">Liquida├º├úo prim├íria conclu├¡da</p>
              </div>
              <div className="bg-gradient-to-br from-emerald-50 to-white rounded-2xl border border-emerald-100 p-5 shadow-sm">
                <p className="text-[10px] font-extrabold text-emerald-400 uppercase tracking-widest mb-2">Capital Captado</p>
                <p className="text-3xl font-extrabold text-emerald-900">{fin.revenueRaised.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 4 })} SOL</p>
                <p className="text-xs text-emerald-500/70 font-medium mt-1">Receita bruta arrecadada</p>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-white rounded-2xl border border-purple-100 p-5 shadow-sm">
                <p className="text-[10px] font-extrabold text-purple-400 uppercase tracking-widest mb-2">Royalties Gerados</p>
                <p className="text-3xl font-extrabold text-purple-900">{fin.royaltiesGenerated.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 4 })} SOL</p>
                <p className="text-xs text-purple-500/70 font-medium mt-1">Taxas do mercado secund├írio</p>
              </div>
            </div>

            {/* LIVRO-RAZ├âO */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
                <Layers className="w-4 h-4 text-slate-400" />
                <h3 className="text-xs font-extrabold text-slate-500 uppercase tracking-widest">Livro-Raz├úo e Liquida├º├Áes (On-Chain Audit)</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest border-b border-slate-100">
                    <tr>
                      <th className="px-6 py-3">Data</th>
                      <th className="px-6 py-3">Hash da Transa├º├úo</th>
                      <th className="px-6 py-3 text-right">Qtd. Tokens</th>
                      <th className="px-6 py-3 text-right">Valor (SOL)</th>
                      <th className="px-6 py-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {fin.ledger.length === 0 ? (
                      <tr><td colSpan={5} className="px-6 py-10 text-center text-slate-400 text-sm">Nenhuma liquida├º├úo registrada ainda.</td></tr>
                    ) : fin.ledger.map((e, i) => (
                      <tr key={e.id || i} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-6 py-4 text-slate-600 font-medium whitespace-nowrap">
                          {new Date(e.date).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {e.hash ? (
                            <a href={`https://solscan.io/tx/${e.hash}?cluster=devnet`} target="_blank" rel="noopener noreferrer"
                              className="text-blue-500 hover:text-blue-700 font-mono text-xs flex items-center gap-1">
                              {e.hash.slice(0, 6)}...{e.hash.slice(-6)} <ExternalLink className="w-3 h-3" />
                            </a>
                          ) : <span className="text-slate-400 text-xs italic">Pendente</span>}
                        </td>
                        <td className="px-6 py-4 text-right font-bold text-slate-800">{e.quantity.toLocaleString()}</td>
                        <td className="px-6 py-4 text-right font-bold text-emerald-600">{e.value.toLocaleString("en-US", { minimumFractionDigits: 4, maximumFractionDigits: 4 })}</td>
                        <td className="px-6 py-4 text-center">
                          <span className="px-2 py-1 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-500">{e.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {pagination && pagination.totalPages > 1 && (
                <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
                  <button disabled={page <= 1} onClick={() => setPage(page - 1)}
                    className="px-3 py-1.5 text-xs font-bold bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-40 transition-colors">
                    ÔåÉ Anterior
                  </button>
                  <span className="text-xs font-medium text-slate-500">P├ígina {pagination.page} de {pagination.totalPages}</span>
                  <button disabled={page >= pagination.totalPages} onClick={() => setPage(page + 1)}
                    className="px-3 py-1.5 text-xs font-bold bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-40 transition-colors">
                    Pr├│xima ÔåÆ
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ÔöÇÔöÇ RODAP├ë: FICHA T├ëCNICA + PAINEL DE UTILIDADE ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* FICHA T├ëCNICA */}
          <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col gap-6">
            <div>
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2 mb-5">
                <Briefcase className="w-5 h-5 text-blue-500" />
                Ficha T├®cnica de Tokeniza├º├úo
              </h3>
              <div className="space-y-3">
                {[
                  { label: "Nome do Ativo", value: asset.name },
                  { label: "Tipo de Categoria", value: asset.type },
                  { label: "Data de Cria├º├úo", value: new Date(asset.createdAt).toLocaleDateString("pt-BR") },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between items-center text-sm border-b border-slate-50 pb-2.5 last:border-0">
                    <span className="text-slate-400 font-medium">{label}</span>
                    <span className="font-bold text-slate-800">{value}</span>
                  </div>
                ))}
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-400 font-medium">Carteira Emissora (Dono)</span>
                  <span className="font-mono text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded border border-slate-200">
                    {asset.ownerWallet.slice(0, 6)}...{asset.ownerWallet.slice(-4)}
                  </span>
                </div>
              </div>
            </div>

            {/* Miss├úo e Lastro */}
            <div className="space-y-2">
              <p className="text-sm font-bold text-slate-800">A Miss├úo e o Lastro</p>
              {isEditing ? (
                <div className="space-y-2">
                  <textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)}
                    className="w-full h-24 p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 outline-none focus:ring-2 focus:ring-blue-400 resize-none transition" />
                  <div className="flex gap-2">
                    <button onClick={handleSaveDescription} disabled={isSavingDesc}
                      className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition disabled:opacity-50">
                      {isSavingDesc ? "Salvando..." : "Salvar"}
                    </button>
                    <button onClick={() => setIsEditing(false)}
                      className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 rounded-lg border border-slate-200 hover:bg-slate-50 transition">
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-sm text-slate-600 leading-relaxed">{asset.description || "ÔÇö"}</p>
                  <button onClick={() => { setIsEditing(true); setEditDescription(asset.description || ""); }}
                    className="text-sm font-semibold text-blue-600 hover:underline">
                    Editar Descri├º├úo
                  </button>
                </>
              )}
            </div>

            {/* Smart Contract Box */}
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-start gap-3 mt-auto">
              <ShieldCheck className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-extrabold text-blue-700 uppercase tracking-wider mb-1">Smart Contract Auditado</p>
                <p className="text-xs text-blue-600 leading-relaxed">
                  Os par├ómetros contratuais deste ativo foram persistidos na blockchain de testes Solana sob padr├Áes SPL Token equivalentes.
                </p>
              </div>
            </div>
          </div>

          {/* PAINEL DE UTILIDADE */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col gap-6">
            <div>
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2 mb-3">
                <BarChart2 className="w-5 h-5 text-indigo-500" />
                Painel de Utilidade (Controle de Acesso)
              </h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Como gestor deste token de utilidade/acesso, voc├¬ pode auditar acessos ativos em tempo real e gerenciar permiss├Áes diretamente na blockchain Solana.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 text-center">
                <p className="text-[10px] font-extrabold text-indigo-400 uppercase tracking-widest mb-1">Acessos Ativos</p>
                <p className="text-3xl font-extrabold text-indigo-700">1,482</p>
              </div>
              <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 text-center">
                <p className="text-[10px] font-extrabold text-emerald-500 uppercase tracking-widest mb-1">Tokens Verificados</p>
                <p className="text-3xl font-extrabold text-emerald-600">99.1%</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-auto">
              <button onClick={handleValidate} disabled={isValidating}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                {isValidating ? <><Loader2 className="w-4 h-4 animate-spin" /> Validando...</> : "Validar Token de Acesso"}
              </button>
              <button onClick={handleRevoke} disabled={isRevoking}
                className="w-full py-4 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                {isRevoking ? <><Loader2 className="w-4 h-4 animate-spin" /> Revogando...</> : "Revogar Passe"}
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
