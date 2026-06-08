"use client";
import { useState, useEffect, useMemo } from "react";

import { useCredits, CREDIT_PLANS, CreditPlan } from "@/context/credits-context";
import { useWallet } from "@/context/wallet-context";
import { X, Zap, Loader2, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDict } from "@/lib/i18n/client";

export function CreditsModal() {
    const {
        isModalOpen,
        closeModal,
        buyCredits,
        isLoading: isContextLoading,
        solPrice,
        isPriceLoading,
        oracleError
    } = useCredits();
    const { isConnected } = useWallet();
    const dict = useDict();
    const t = dict.credits;
    const [loadingPackageId, setLoadingPackageId] = useState<string | null>(null);

    useEffect(() => {
        if (solPrice) {
            console.log(`[UI Update] New SOL price: ${solPrice.toFixed(2)}`);
        }
    }, [solPrice]);

    if (!isModalOpen) return null;

    const handlePurchase = async (originalPlan: CreditPlan) => {
        if (!isConnected) {
            alert(t.connectFirst);
            return;
        }

        setLoadingPackageId(originalPlan.id);
        try {
            await buyCredits(originalPlan);
        } finally {
            setLoadingPackageId(null);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
            <div
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                onClick={closeModal}
            />

            <div className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full mx-4 overflow-hidden animate-in zoom-in-95 fade-in duration-200">
                <button
                    onClick={closeModal}
                    className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 transition-colors z-10"
                    aria-label={t.close}
                >
                    <X className="w-5 h-5 text-slate-400" />
                </button>

                <div className="flex flex-col md:flex-row">
                    <div className="bg-slate-900 text-white p-8 md:w-80 flex flex-col justify-between min-h-[480px]">
                        <div>
                            <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center mb-6">
                                <Zap className="w-6 h-6 text-white" />
                            </div>

                            <h2 className="text-2xl font-bold mb-4 leading-tight">
                                {t.modalTitle}
                            </h2>

                            <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                                {t.modalDesc}
                            </p>

                            <div className="flex items-center gap-2 text-sm text-slate-300">
                                <Check className="w-4 h-4 text-green-400" />
                                <span>{t.secureTx}</span>
                            </div>
                        </div>

                        <p className="text-xs text-slate-500 mt-8 leading-relaxed">
                            {t.footerNote}
                        </p>
                    </div>

                    <div className="flex-1 p-8 bg-white">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                            <div>
                                <h3 className="text-xl font-semibold text-slate-900 mb-1">
                                    {t.pickPackage}
                                </h3>
                                <p className="text-sm text-slate-500">
                                    {t.pickPackageDesc}
                                </p>
                            </div>

                            <div className={cn(
                                "flex items-center gap-2 px-3 py-1.5 border rounded-lg text-xs font-medium self-start sm:self-center shadow-sm transition-colors",
                                oracleError
                                    ? "bg-amber-50/50 border-amber-200/60 text-amber-700"
                                    : "bg-slate-50 border-slate-100 text-slate-600"
                            )}>
                                <span className="relative flex h-2 w-2">
                                    <span className={cn(
                                        "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
                                        oracleError ? "bg-amber-400" : "bg-green-400"
                                    )}></span>
                                    <span className={cn(
                                        "relative inline-flex rounded-full h-2 w-2",
                                        oracleError ? "bg-amber-500" : "bg-green-500"
                                    )}></span>
                                </span>
                                {isPriceLoading ? (
                                    <span className="flex items-center gap-1.5">
                                        <Loader2 className="w-3 h-3 animate-spin text-slate-400" />
                                        {t.fetchingOracle}
                                    </span>
                                ) : oracleError ? (
                                    <span>
                                        {t.safeMode} <strong className="text-amber-900 font-semibold">1 SOL = $150.00</strong>
                                    </span>
                                ) : solPrice ? (
                                    <span className="text-slate-700">
                                        {t.jupiterQuote} <strong className="text-slate-900 font-semibold">1 SOL = ${solPrice.toFixed(2)}</strong>
                                    </span>
                                ) : (
                                    <span className="text-amber-600 font-medium">{t.oracleError}</span>
                                )}
                            </div>
                        </div>

                        {oracleError && (
                            <div className="mb-6 p-4 bg-amber-50 border border-amber-100/80 rounded-xl text-xs text-amber-800 flex items-start gap-2.5 animate-in fade-in slide-in-from-top-2 duration-300">
                                <span className="relative flex h-2 w-2 mt-1">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                                </span>
                                <div className="flex-1">
                                    <span className="font-semibold block mb-0.5 text-amber-900">{t.contingencyTitle}</span>
                                    <span>{oracleError} {t.contingencyTail}</span>
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {CREDIT_PLANS.map((plan) => (
                                <PlanCard
                                    key={plan.id}
                                    plan={plan}
                                    onSelect={handlePurchase}
                                    isLoading={loadingPackageId === plan.id}
                                    isAnyLoading={loadingPackageId !== null || isContextLoading}
                                    solPrice={solPrice}
                                />
                            ))}
                        </div>

                        <p className="text-xs text-center text-slate-400 mt-6">
                            {t.confirmFooter}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

interface PlanCardProps {
    plan: CreditPlan;
    onSelect: (plan: CreditPlan) => void;
    isLoading: boolean;
    isAnyLoading: boolean;
    solPrice: number | null;
}

function PlanCard({ plan, onSelect, isLoading, isAnyLoading, solPrice }: PlanCardProps) {
    const dict = useDict();
    const t = dict.credits;
    const solAmount = useMemo(() => {
        const currentSolPrice = solPrice || 150;
        return (plan.priceUSD / currentSolPrice).toFixed(4);
    }, [plan.priceUSD, solPrice]);

    const [isFlashing, setIsFlashing] = useState(false);
    useEffect(() => {
        if (solPrice) {
            setIsFlashing(true);
            const timer = setTimeout(() => setIsFlashing(false), 800);
            return () => clearTimeout(timer);
        }
    }, [solPrice]);

    const planNameMap: Record<string, string> = {
        trial: t.planTrial,
        starter: t.planStarter,
        pro: t.planPro,
        expert: t.planExpert,
    };
    const planDescMap: Record<string, string> = {
        trial: t.planTrialDesc,
        starter: t.planStarterDesc,
        pro: t.planProDesc,
        expert: t.planExpertDesc,
    };
    const displayName = planNameMap[plan.id] ?? plan.name;
    const displayDesc = planDescMap[plan.id] ?? "";

    return (
        <div
            className={cn(
                "relative border rounded-xl p-5 transition-all duration-200",
                plan.popular
                    ? "border-blue-500 bg-blue-50/30 shadow-lg ring-1 ring-blue-200"
                    : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-md"
            )}
        >
            {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-slate-900 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                        {t.mostPopular}
                    </span>
                </div>
            )}

            <div className="flex justify-between items-start mb-1">
                <div>
                    <h4 className="font-semibold text-slate-900 text-base">{displayName}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                        {displayDesc}
                    </p>
                </div>

                <div className="flex flex-col items-end">
                    <span
                        className={cn(
                            "text-[10px] font-medium text-white bg-slate-950 px-2 py-1 rounded transition-all duration-300 transform inline-block",
                            isFlashing && "bg-green-600 scale-110 shadow-[0_0_12px_rgba(22,163,74,0.6)] text-white"
                        )}
                    >
                        {solAmount} <span className={cn("text-slate-400 transition-colors", isFlashing && "text-green-200")}>SOL</span>
                    </span>
                    <span className="text-[10px] text-slate-400 mt-1">
                        {plan.priceUsdt} USD
                    </span>
                </div>
            </div>

            <div className="flex items-baseline gap-1.5 my-4">
                <span className="text-4xl font-bold text-slate-900">{plan.credits}</span>
                <span className="text-sm text-slate-500">{t.credits}</span>
            </div>

            <button
                onClick={() => onSelect(plan)}
                disabled={isAnyLoading}
                className={cn(
                    "w-full py-2.5 rounded-lg font-medium text-sm transition-all duration-200",
                    plan.popular
                        ? "bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-400"
                        : "bg-slate-900 text-white hover:bg-slate-800 disabled:bg-slate-400",
                    "disabled:cursor-not-allowed"
                )}
            >
                {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {t.processing}
                    </span>
                ) : (
                    t.buy
                )}
            </button>
        </div>
    );
}
