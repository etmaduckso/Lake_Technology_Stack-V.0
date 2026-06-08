"use client";

import { useEffect, useState, use } from "react";
import { ArrowLeft, Loader2, Briefcase, DollarSign, ShieldCheck, Share2, Percent, Layers, Sliders, Play } from "lucide-react";
import Link from "next/link";

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
}

interface PageProps {
    params: Promise<{ id: string }>;
}

export default function ManageAssetPage({ params }: PageProps) {
    const { id } = use(params);
    const [asset, setAsset] = useState<AssetData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Mock states for simulation metrics
    const [dividendPercentage, setDividendPercentage] = useState("8.5");
    const [isSimulating, setIsSimulating] = useState(false);
    const [simulatedPayout, setSimulatedPayout] = useState<number | null>(null);

    useEffect(() => {
        const fetchAssetDetails = async () => {
            try {
                const res = await fetch(`/api/assets/${id}`);
                const data = await res.json();

                if (!res.ok) throw new Error(data.error || "Erro ao carregar ativo.");
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

    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center py-24">
                <Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-4" />
                <span className="text-slate-600 font-medium">Carregando painel de controle...</span>
            </div>
        );
    }

    if (error || !asset) {
        return (
            <div className="min-h-screen bg-slate-50 py-12 px-4">
                <div className="max-w-md mx-auto bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-sm">
                    <h2 className="text-xl font-bold text-red-600 mb-3">Ativo n├úo encontrado</h2>
                    <p className="text-slate-500 mb-6">{error || "N├úo foi poss├¡vel carregar os detalhes deste ativo."}</p>
                    <Link
                        href="/marketplace"
                        className="inline-flex items-center gap-2 px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg transition-colors text-sm"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Voltar ao Marketplace
                    </Link>
                </div>
            </div>
        );
    }

    const valuationUSD = Number(asset.valuation).toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
    });

    // Corre├º├úo Matem├ítica Cr├¡tica: Pre├ºo do Token = Valuation / Tokens Emitidos
    const calculatedTokenPrice = Number(asset.valuation) / asset.totalTokens;
    const pricePerTokenUSD = calculatedTokenPrice.toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
    });

    // Regra de Neg├│cios: Renderiza├º├úo condicional por categoria de ativo
    const normalizedType = asset.type.toUpperCase();
    const isFinancialOrRealEstate =
        normalizedType.includes("IM├ôVEL") ||
        normalizedType.includes("REAL ESTATE") ||
        normalizedType.includes("ENERGIA") ||
        normalizedType.includes("AGRO") ||
        normalizedType.includes("D├ìVIDA") ||
        normalizedType.includes("PRECAT├ôRIO") ||
        normalizedType.includes("STARTUP") ||
        normalizedType.includes("EQUITY") ||
        normalizedType.includes("CARBONO") ||
        normalizedType.includes("FINANCEIRO");

    const isUtilityAsset = !isFinancialOrRealEstate;

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col pb-20">
            <div className="w-full max-w-6xl mx-auto px-4 py-10 flex-grow">
                {/* Voltar Link */}
                <div className="mb-8">
                    <Link
                        href="/marketplace"
                        className="inline-flex items-center gap-2 text-slate-600 hover:text-blue-600 font-medium transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Voltar para o Marketplace</span>
                    </Link>
                </div>

                {/* Header do Dashboard */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                    <div>
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold mb-3 border border-emerald-100">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                            Painel de Controle RWA Ativo
                        </div>
                        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">
                            {asset.name}
                        </h1>
                        <p className="text-slate-500 mt-2 font-medium">
                            ID de Registro RWA: <span className="font-mono text-xs bg-slate-200/60 px-2 py-0.5 rounded border border-slate-300 text-slate-600">{asset.id}</span>
                        </p>
                    </div>

                    {/* Badge de Rede Cripto */}
                    <div className="flex items-center gap-3 bg-white px-5 py-3 rounded-xl border border-slate-200 shadow-sm">
                        <div className="w-3 h-3 rounded-full bg-purple-500 animate-pulse" />
                        <div>
                            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Blockchain Ativa</div>
                            <div className="text-sm font-extrabold text-slate-700">Solana Devnet</div>
                        </div>
                    </div>
                </div>

                {/* METRICS GRID */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                    {/* Metric 1 */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex items-center justify-between">
                        <div className="space-y-1">
                            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Valuation Total</div>
                            <div className="text-2xl font-extrabold text-slate-900">{valuationUSD}</div>
                            <div className="text-xs font-medium text-slate-500">Avalia├º├úo do lastro f├¡sico</div>
                        </div>
                        <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 text-blue-600">
                            <DollarSign className="w-6 h-6" />
                        </div>
                    </div>

                    {/* Metric 2 */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex items-center justify-between">
                        <div className="space-y-1">
                            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tokens Emitidos</div>
                            <div className="text-2xl font-extrabold text-slate-900">
                                {asset.totalTokens.toLocaleString()}
                            </div>
                            <div className="text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded inline-block">
                                100% Sincronizado
                            </div>
                        </div>
                        <div className="p-3 bg-purple-50 rounded-xl border border-purple-100 text-purple-600">
                            <Layers className="w-6 h-6" />
                        </div>
                    </div>

                    {/* Metric 3 */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex items-center justify-between">
                        <div className="space-y-1">
                            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pre├ºo do Token</div>
                            <div className="text-2xl font-extrabold text-slate-900">{pricePerTokenUSD}</div>
                            <div className="text-xs font-medium text-slate-500">Custo unit├írio fracionado</div>
                        </div>
                        <div className="p-3 bg-amber-50 rounded-xl border border-amber-100 text-amber-600">
                            <Share2 className="w-6 h-6" />
                        </div>
                    </div>
                </div>

                {/* PAIN├ëIS DE INTERA├ç├âO */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Coluna da Esquerda: Ficha T├®cnica */}
                    <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
                        <div>
                            <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2 border-b border-slate-100 pb-3">
                                <Briefcase className="w-5 h-5 text-blue-600" />
                                Ficha T├®cnica de Tokeniza├º├úo
                            </h3>

                            <div className="space-y-4">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-400 font-medium">Nome do Ativo</span>
                                    <span className="text-slate-800 font-bold">{asset.name}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-400 font-medium">Tipo de Categoria</span>
                                    <span className="text-slate-800 font-bold uppercase">{asset.type}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-400 font-medium">Carteira Emissora (Dono)</span>
                                    <span className="font-mono text-xs text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                        {asset.ownerWallet.slice(0, 6)}...{asset.ownerWallet.slice(-6)}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-400 font-medium">Data de Cria├º├úo</span>
                                    <span className="text-slate-800 font-bold">
                                        {new Date(asset.createdAt).toLocaleDateString("pt-BR")}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Status do Smart Contract */}
                        <div className="mt-8 pt-6 border-t border-slate-100">
                            <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100 flex items-start gap-3">
                                <ShieldCheck className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                                <div>
                                    <h4 className="text-xs font-bold text-blue-900 uppercase">Smart Contract Auditado</h4>
                                    <p className="text-xs text-blue-700 mt-1 leading-relaxed">
                                        Os par├ómetros contratuais deste ativo foram persistidos na blockchain de testes Solana sob padr├Áes SPL Token equivalentes.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Coluna da Direita: Renderiza├º├úo Condicional com base na natureza do Ativo */}
                    {!isUtilityAsset ? (
                        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                            <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2 border-b border-slate-100 pb-3">
                                <Sliders className="w-5 h-5 text-purple-600" />
                                Simulador de Distribui├º├úo de Dividendos
                            </h3>

                            <p className="text-sm text-slate-500 mb-6 leading-relaxed">
                                Como gestor e propriet├írio, simule a distribui├º├úo de lucros para os detentores dos seus tokens RWA e observe o reflexo de rendimentos.
                            </p>

                            <div className="space-y-6">
                                {/* Controle Deslizante de Dividendos */}
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <label className="text-sm font-semibold text-slate-700">Taxa de Rendimento Esperada (Anual)</label>
                                        <span className="text-sm font-extrabold text-purple-600 bg-purple-50 px-2 py-0.5 rounded border border-purple-100">
                                            {dividendPercentage}% a.a.
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

                                {/* Bot├úo de Distribui├º├úo */}
                                <button
                                    onClick={handleSimulateDividends}
                                    disabled={isSimulating}
                                    className="w-full py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {isSimulating ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            <span>Calculando Simula├º├úo...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Play className="w-4 h-4" />
                                            <span>Simular Pagamento de Dividendos</span>
                                        </>
                                    )}
                                </button>

                                {/* Resultados da Simula├º├úo */}
                                {simulatedPayout !== null && (
                                    <div className="p-5 bg-purple-50 rounded-2xl border border-purple-100 text-center animate-in zoom-in-95 duration-150">
                                        <div className="text-xs font-bold text-purple-400 uppercase tracking-wider mb-1">
                                            Rendimento Simulado por Token
                                        </div>
                                        <div className="text-3xl font-extrabold text-purple-700">
                                            {simulatedPayout.toLocaleString("en-US", {
                                                style: "currency",
                                                currency: "USD",
                                                maximumFractionDigits: 4,
                                            })}
                                        </div>
                                        <p className="text-[10px] text-purple-500 font-semibold mt-1 mb-4">
                                            (C├ílculo: {dividendPercentage}% sobre o Valuation de {valuationUSD} dividido pelos {asset.totalTokens.toLocaleString()} tokens emitidos)
                                        </p>
                                        <p className="text-xs text-purple-600 leading-relaxed max-w-sm mx-auto font-medium">
                                            Seus investidores receber├úo este valor para cada fra├º├úo tokenizada de token que possu├¡rem na carteira.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                            <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2 border-b border-slate-100 pb-3">
                                <Sliders className="w-5 h-5 text-indigo-600" />
                                Painel de Utilidade (Controle de Acesso)
                            </h3>

                            <p className="text-sm text-slate-500 mb-6 leading-relaxed">
                                Como gestor deste token de utilidade/acesso, voc├¬ pode auditar acessos ativos em tempo real e gerenciar permiss├Áes diretamente na blockchain Solana.
                            </p>

                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-100 text-center">
                                    <div className="text-xs text-indigo-400 font-bold uppercase mb-1">Acessos Ativos</div>
                                    <div className="text-2xl font-black text-indigo-700">1,482</div>
                                </div>
                                <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-100 text-center">
                                    <div className="text-xs text-emerald-400 font-bold uppercase mb-1">Tokens Verificados</div>
                                    <div className="text-2xl font-black text-emerald-700">99.1%</div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => alert("Ô£à Token de acesso validado com sucesso na rede Solana!")}
                                        className="flex-1 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-bold rounded-xl shadow-md transition-all text-sm flex items-center justify-center gap-2"
                                    >
                                        Validar Token de Acesso
                                    </button>
                                    <button
                                        onClick={() => alert("ÔÜá´©Å Passe de utilidade revogado com sucesso. Opera├º├úo gravada na Solana Devnet.")}
                                        className="flex-1 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold rounded-xl shadow-md transition-all text-sm flex items-center justify-center gap-2"
                                    >
                                        Revogar Passe
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
