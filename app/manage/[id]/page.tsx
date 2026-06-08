"use client";

import { useEffect, useState, use } from "react";
import { ArrowLeft, Loader2, Briefcase, DollarSign, ShieldCheck, Share2, Layers, Sliders, Play, ExternalLink } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useWallet } from "@solana/wallet-adapter-react";
import { useRouter } from "next/navigation";
import { CurrencyDisplay } from "@/components/ui/CurrencyDisplay";
import { useDict, useLocale } from "@/lib/i18n/client";

interface AssetData {
    id: string;
    name: string;
    type: string;
    valuation: string;
    tokenPrice: string;
    totalTokens: number;
    status: string;
    ownerWallet: string;
    createdAt: string;
    description?: string | null;
    imageUrl?: string | null;
    contractUrl?: string | null;
}

interface PageProps {
    params: Promise<{ id: string }>;
}

export default function ManageAssetPage({ params }: PageProps) {
    const { id } = use(params);
    const wallet = useWallet();
    const router = useRouter();
    const dict = useDict();
    const { locale } = useLocale();
    const t = dict.manage;
    const [asset, setAsset] = useState<AssetData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [dividendPercentage, setDividendPercentage] = useState("8.5");
    const [isSimulating, setIsSimulating] = useState(false);
    const [simulatedPayout, setSimulatedPayout] = useState<number | null>(null);

    const [isEditing, setIsEditing] = useState(false);
    const [editDescription, setEditDescription] = useState("");
    const [isSavingDesc, setIsSavingDesc] = useState(false);

    useEffect(() => {
        const fetchAssetDetails = async () => {
            try {
                const res = await fetch(`/api/assets/${id}`);
                const data = await res.json();

                if (!res.ok) throw new Error(data.error || "Error");
                setAsset(data.asset);
            } catch (err: any) {
                console.error("[ManageAssetPage] Erro:", err);
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchAssetDetails();
    }, [id]);

    useEffect(() => {
        if (!isLoading && asset) {
            if (!wallet.connected || wallet.publicKey?.toBase58() !== asset.ownerWallet) {
                router.push("/marketplace");
            }
        }
    }, [wallet.connected, wallet.publicKey, asset, isLoading, router]);

    const handleSimulateDividends = () => {
        if (!asset) return;
        setIsSimulating(true);
        setTimeout(() => {
            const valuationNum = Number(asset.valuation);
            const rate = Number(dividendPercentage) / 100;
            const payout = (valuationNum * rate) / asset.totalTokens;
            setSimulatedPayout(payout);
            setIsSimulating(false);
        }, 1200);
    };

    const handleSaveDescription = async () => {
        if (!asset) return;
        setIsSavingDesc(true);
        try {
            const res = await fetch(`/api/assets/${asset.id}?wallet=${asset.ownerWallet}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ description: editDescription }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setAsset({ ...asset, description: editDescription });
            setIsEditing(false);
        } catch (err: any) {
            alert(`Error: ${err.message}`);
        } finally {
            setIsSavingDesc(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center py-24">
                <Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-4" />
                <span className="text-slate-600 font-medium">{t.loading}</span>
            </div>
        );
    }

    if (error || !asset || (wallet.publicKey?.toBase58() !== asset?.ownerWallet)) {
        return (
            <div className="min-h-screen bg-slate-50 py-12 px-4">
                <div className="max-w-md mx-auto bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-sm">
                    <h2 className="text-xl font-bold text-red-600 mb-3">{t.accessDenied}</h2>
                    <p className="text-slate-500 mb-6">{error || t.accessDeniedBody}</p>
                    <Link
                        href="/marketplace"
                        className="inline-flex items-center gap-2 px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg transition-colors text-sm"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        {t.back}
                    </Link>
                </div>
            </div>
        );
    }

    const numberLocale = locale === "pt-BR" ? "pt-BR" : "en-US";
    const valuationUSD = Number(asset.valuation).toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
    });

    const calculatedTokenPrice = Number(asset.valuation) / asset.totalTokens;

    const normalizedType = asset.type.toUpperCase();
    const isFinancialOrRealEstate =
        normalizedType.includes("IMÓVEL") ||
        normalizedType.includes("REAL ESTATE") ||
        normalizedType.includes("ENERGIA") ||
        normalizedType.includes("ENERGY") ||
        normalizedType.includes("AGRO") ||
        normalizedType.includes("DÍVIDA") ||
        normalizedType.includes("DEBT") ||
        normalizedType.includes("PRECATÓRIO") ||
        normalizedType.includes("STARTUP") ||
        normalizedType.includes("EQUITY") ||
        normalizedType.includes("CARBONO") ||
        normalizedType.includes("CARBON") ||
        normalizedType.includes("FINANCEIRO") ||
        normalizedType.includes("FINANCIAL");

    const isUtilityAsset = !isFinancialOrRealEstate;

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col pb-20">
            <div className="w-full max-w-6xl mx-auto px-4 py-10 flex-grow">
                <div className="mb-8">
                    <Link
                        href="/marketplace"
                        className="inline-flex items-center gap-2 text-slate-600 hover:text-blue-600 font-medium transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span>{t.back}</span>
                    </Link>
                </div>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                    <div>
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold mb-3 border border-emerald-100">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                            {t.panelActive}
                        </div>
                        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">
                            {asset.name}
                        </h1>
                        <p className="text-slate-500 mt-2 font-medium">
                            {t.assetId} <span className="font-mono text-xs bg-slate-200/60 px-2 py-0.5 rounded border border-slate-300 text-slate-600">{asset.id}</span>
                        </p>
                    </div>

                    <div className="flex items-center gap-3 bg-white px-5 py-3 rounded-xl border border-slate-200 shadow-sm">
                        <div className="w-3 h-3 rounded-full bg-purple-500 animate-pulse" />
                        <div>
                            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{t.activeBlockchain}</div>
                            <div className="text-sm font-extrabold text-slate-700">{t.solanaDevnet}</div>
                        </div>
                    </div>
                </div>

                {asset.imageUrl && asset.imageUrl.startsWith("https://") && (
                    <div className="w-full mb-10">
                        <div className="w-full h-72 rounded-3xl overflow-hidden border border-slate-200 shadow-sm relative bg-slate-50 group flex items-center justify-center">
                            <Image
                                src={asset.imageUrl}
                                alt={asset.name}
                                fill
                                className="object-contain p-6 group-hover:scale-[1.02] transition-transform duration-500"
                            />
                            <div className="absolute top-4 left-4 px-3 py-1.5 rounded-xl bg-slate-900/80 backdrop-blur-sm text-white text-xs font-bold flex items-center gap-1.5 border border-white/10 shadow z-10">
                                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                                {t.arweaveImage}
                            </div>
                        </div>
                        <div className="mt-3 flex justify-end">
                            <a
                                href={asset.imageUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 font-semibold text-sm transition-all shadow-sm group/link"
                            >
                                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                                {t.auditDoc}
                                <ExternalLink className="w-3.5 h-3.5 opacity-60 group-hover/link:opacity-100 transition-opacity" />
                            </a>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex items-center justify-between">
                        <div className="space-y-1">
                            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t.valuationTotal}</div>
                            <CurrencyDisplay variant="transparent" brlValue={Number(asset.valuation)} />
                            <div className="text-xs font-medium text-slate-500">{t.valuationDesc}</div>
                        </div>
                        <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 text-blue-600">
                            <DollarSign className="w-6 h-6" />
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex items-center justify-between">
                        <div className="space-y-1">
                            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t.tokensIssued}</div>
                            <div className="text-2xl font-extrabold text-slate-900">
                                {asset.totalTokens.toLocaleString(numberLocale)}
                            </div>
                            <div className="text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded inline-block">
                                {t.synced}
                            </div>
                        </div>
                        <div className="p-3 bg-purple-50 rounded-xl border border-purple-100 text-purple-600">
                            <Layers className="w-6 h-6" />
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex items-center justify-between">
                        <div className="space-y-1">
                            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t.tokenPrice}</div>
                            <CurrencyDisplay variant="transparent" brlValue={calculatedTokenPrice} />
                            <div className="text-xs font-medium text-slate-500">{t.tokenPriceDesc}</div>
                        </div>
                        <div className="p-3 bg-amber-50 rounded-xl border border-amber-100 text-amber-600">
                            <Share2 className="w-6 h-6" />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
                        <div>
                            <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2 border-b border-slate-100 pb-3">
                                <Briefcase className="w-5 h-5 text-blue-600" />
                                {t.techTitle}
                            </h3>

                            <div className="space-y-4">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-400 font-medium">{t.assetName}</span>
                                    <span className="text-slate-800 font-bold">{asset.name}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-400 font-medium">{t.category}</span>
                                    <span className="text-slate-800 font-bold uppercase">{asset.type}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-400 font-medium">{t.issuer}</span>
                                    <span className="font-mono text-xs text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                        {asset.ownerWallet.slice(0, 6)}...{asset.ownerWallet.slice(-6)}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-400 font-medium">{t.createdAt}</span>
                                    <span className="text-slate-800 font-bold">
                                        {new Date(asset.createdAt).toLocaleDateString(numberLocale)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 pt-6 border-t border-slate-100">
                            <h4 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                                {t.mission}
                            </h4>
                            {isEditing ? (
                                <div className="space-y-3">
                                    <textarea
                                        value={editDescription}
                                        onChange={(e) => setEditDescription(e.target.value)}
                                        className="w-full p-3 text-sm text-slate-700 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
                                        rows={4}
                                        placeholder={t.editPh}
                                    />
                                    <div className="flex gap-2">
                                        <button
                                            onClick={handleSaveDescription}
                                            disabled={isSavingDesc}
                                            className="px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50"
                                        >
                                            {isSavingDesc ? t.saving : t.save}
                                        </button>
                                        <button
                                            onClick={() => setIsEditing(false)}
                                            disabled={isSavingDesc}
                                            className="px-4 py-2 bg-white border border-slate-200 text-slate-600 text-sm font-bold rounded-lg hover:bg-slate-50"
                                        >
                                            {t.cancel}
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <p className="text-sm text-slate-600 leading-relaxed">
                                        {asset.description || t.noDescription}
                                    </p>
                                    <button
                                        onClick={() => {
                                            setEditDescription(asset.description || "");
                                            setIsEditing(true);
                                        }}
                                        className="text-sm font-bold text-blue-600 hover:text-blue-700 underline underline-offset-2"
                                    >
                                        {t.editDesc}
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="mt-8 pt-6 border-t border-slate-100">
                            <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100 flex items-start gap-3">
                                <ShieldCheck className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                                <div>
                                    <h4 className="text-xs font-bold text-blue-900 uppercase">{t.contractTitle}</h4>
                                    <p className="text-xs text-blue-700 mt-1 leading-relaxed">
                                        {t.contractBody}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {!isUtilityAsset ? (
                        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                            <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2 border-b border-slate-100 pb-3">
                                <Sliders className="w-5 h-5 text-purple-600" />
                                {t.divTitle}
                            </h3>

                            <p className="text-sm text-slate-500 mb-6 leading-relaxed">
                                {t.divDesc}
                            </p>

                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <label className="text-sm font-semibold text-slate-700">{t.yieldRate}</label>
                                        <span className="text-sm font-extrabold text-purple-600 bg-purple-50 px-2 py-0.5 rounded border border-purple-100">
                                            {dividendPercentage}% {t.pAnnum}
                                        </span>
                                    </div>
                                    <input
                                        type="range"
                                        min="1"
                                        max="30"
                                        step="0.5"
                                        value={dividendPercentage}
                                        onChange={(e) => {
                                            setDividendPercentage(e.target.value);
                                            setSimulatedPayout(null);
                                        }}
                                        className="w-full accent-purple-600"
                                    />
                                </div>

                                <button
                                    onClick={handleSimulateDividends}
                                    disabled={isSimulating}
                                    className="w-full py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {isSimulating ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            <span>{t.calculating}</span>
                                        </>
                                    ) : (
                                        <>
                                            <Play className="w-4 h-4" />
                                            <span>{t.simulate}</span>
                                        </>
                                    )}
                                </button>

                                {simulatedPayout !== null && (
                                    <div className="p-5 bg-purple-50 rounded-2xl border border-purple-100 text-center animate-in zoom-in-95 duration-150">
                                        <div className="text-xs font-bold text-purple-400 uppercase tracking-wider mb-1">
                                            {t.yieldPerToken}
                                        </div>
                                        <div className="text-3xl font-extrabold text-purple-700">
                                            {simulatedPayout.toLocaleString("en-US", {
                                                style: "currency",
                                                currency: "USD",
                                                maximumFractionDigits: 4,
                                            })}
                                        </div>
                                        <p className="text-[10px] text-purple-500 font-semibold mt-1 mb-4">
                                            {t.yieldCalc
                                              .replace("{pct}", dividendPercentage)
                                              .replace("{val}", valuationUSD)
                                              .replace("{tokens}", asset.totalTokens.toLocaleString(numberLocale))}
                                        </p>
                                        <p className="text-xs text-purple-600 leading-relaxed max-w-sm mx-auto font-medium">
                                            {t.yieldHint}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                            <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2 border-b border-slate-100 pb-3">
                                <Sliders className="w-5 h-5 text-indigo-600" />
                                {t.utilTitle}
                            </h3>

                            <p className="text-sm text-slate-500 mb-6 leading-relaxed">
                                {t.utilDesc}
                            </p>

                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-100 text-center">
                                    <div className="text-xs text-indigo-400 font-bold uppercase mb-1">{t.activeAccesses}</div>
                                    <div className="text-2xl font-black text-indigo-700">1,482</div>
                                </div>
                                <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-100 text-center">
                                    <div className="text-xs text-emerald-400 font-bold uppercase mb-1">{t.verifiedTokens}</div>
                                    <div className="text-2xl font-black text-emerald-700">99.1%</div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => alert(t.validateOk)}
                                        className="flex-1 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-bold rounded-xl shadow-md transition-all text-sm flex items-center justify-center gap-2"
                                    >
                                        {t.validate}
                                    </button>
                                    <button
                                        onClick={() => alert(t.revokeOk)}
                                        className="flex-1 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold rounded-xl shadow-md transition-all text-sm flex items-center justify-center gap-2"
                                    >
                                        {t.revoke}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
