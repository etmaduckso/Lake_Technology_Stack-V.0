"use client";

import { useCredits } from "@/context/credits-context";
import { useWallet } from "@/context/wallet-context";
import { ArrowLeft, Wallet, Coins, ExternalLink, FileClock, CheckCircle, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { useDict, useLocale } from "@/lib/i18n/client";

export default function HistoryPage() {
    const { isConnected, walletAddress, connectWallet } = useWallet();
    const { history, credits, openModal, refreshCredits, isLoading } = useCredits();
    const dict = useDict();
    const { locale } = useLocale();
    const t = dict.history;

    const planNames: Record<string, string> = {
        trial: t.planTrial,
        starter: t.planStarter,
        pro: t.planPro,
        expert: t.planExpert,
    };

    const truncatedAddress = useMemo(() => {
        if (!walletAddress) return "";
        return `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`;
    }, [walletAddress]);

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
            <div className="w-full max-w-6xl mx-auto px-4 py-12 flex-grow">
                <div className="mb-8">
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 text-slate-600 hover:text-blue-600 font-medium transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span>{t.back}</span>
                    </Link>
                </div>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                    <div>
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-bold mb-3 border border-blue-200">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                            </span>
                            {t.eyebrow}
                        </div>
                        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">
                            {t.title}
                        </h1>
                        <p className="text-slate-500 mt-2">
                            {t.subtitle}
                        </p>
                    </div>

                    {isConnected && walletAddress && (
                        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm flex items-center gap-6">
                            <div className="space-y-1">
                                <div className="text-xs text-slate-400 uppercase font-bold tracking-wider">{t.activeWallet}</div>
                                <div className="font-mono text-sm text-slate-700 bg-slate-100 px-2 py-1 rounded border border-slate-200">
                                    {truncatedAddress}
                                </div>
                            </div>
                            <div className="h-10 w-px bg-slate-200" />
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-blue-100 rounded-lg">
                                    <Coins className="w-5 h-5 text-blue-600" />
                                </div>
                                <div className="space-y-0.5">
                                    <div className="text-xs text-slate-400 uppercase font-bold tracking-wider">{t.yourBalance}</div>
                                    <div className="font-extrabold text-slate-900 text-lg flex items-center gap-2">
                                        <span>{credits}</span>
                                        <span className="text-xs font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">{t.creditsTag}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {!isConnected ? (
                    <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-2xl mx-auto shadow-sm">
                        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6 border border-blue-200">
                            <Wallet className="w-8 h-8 text-blue-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 mb-3">{t.disconnectedTitle}</h2>
                        <p className="text-slate-500 mb-8 max-w-md mx-auto leading-relaxed">
                            {t.disconnectedBody}
                        </p>
                        <button
                            onClick={connectWallet}
                            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-center gap-2 mx-auto"
                        >
                            <Wallet className="w-5 h-5" />
                            {t.connect}
                        </button>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                            <div className="text-sm font-medium text-slate-500 flex items-center gap-1.5">
                                <CheckCircle className="w-4 h-4 text-emerald-500" />
                                {t.secureConn}
                            </div>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={refreshCredits}
                                    disabled={isLoading}
                                    className="p-2 text-slate-500 hover:text-blue-600 bg-slate-100 hover:bg-blue-50 rounded-lg transition-all border border-slate-200 disabled:opacity-50 flex items-center gap-1.5 text-xs font-bold"
                                    title={t.syncTitle}
                                >
                                    <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                                    {t.sync}
                                </button>
                                <button
                                    onClick={openModal}
                                    className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-xs font-bold rounded-lg shadow-sm hover:shadow transition-all flex items-center gap-1.5"
                                >
                                    <Coins className="w-3.5 h-3.5" />
                                    {t.buyCredits}
                                </button>
                            </div>
                        </div>

                        {history.length === 0 ? (
                            <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center max-w-2xl mx-auto shadow-sm">
                                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6 border border-slate-200 text-slate-400">
                                    <FileClock className="w-8 h-8" />
                                </div>
                                <h2 className="text-2xl font-bold text-slate-900 mb-3">{t.emptyTitle}</h2>
                                <p className="text-slate-500 mb-8 max-w-md mx-auto leading-relaxed">
                                    {t.emptyBody}
                                </p>
                                <button
                                    onClick={openModal}
                                    className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold rounded-lg shadow-md hover:shadow-lg transition-all flex items-center gap-2 mx-auto"
                                >
                                    <Coins className="w-5 h-5" />
                                    {t.buyFirst}
                                </button>
                            </div>
                        ) : (
                            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-xs font-extrabold tracking-wider">
                                                <th className="px-6 py-4">{t.colDate}</th>
                                                <th className="px-6 py-4">{t.colOp}</th>
                                                <th className="px-6 py-4">{t.colDesc}</th>
                                                <th className="px-6 py-4 text-right">{t.colCredits}</th>
                                                <th className="px-6 py-4 text-right">{t.colSol}</th>
                                                <th className="px-6 py-4 text-center">{t.colAudit}</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {history.map((record) => {
                                                const isPurchase = record.type === "COMPRA";
                                                const planLabel = record.planId ? planNames[record.planId] || record.planId : t.simUsage;
                                                const dateDisplay = (() => {
                                                  const d = new Date(record.date);
                                                  if (isNaN(d.getTime())) return record.date;
                                                  return d.toLocaleDateString(locale === "pt-BR" ? "pt-BR" : "en-US");
                                                })();

                                                return (
                                                    <tr key={record.id} className="hover:bg-slate-50/50 transition-colors">
                                                        <td className="px-6 py-4 text-sm text-slate-600 font-medium">
                                                            {dateDisplay}
                                                        </td>

                                                        <td className="px-6 py-4">
                                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${
                                                                isPurchase
                                                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                                    : 'bg-blue-50 text-blue-700 border-blue-200'
                                                            }`}>
                                                                {isPurchase ? t.opPurchase : t.opUsage}
                                                            </span>
                                                        </td>

                                                        <td className="px-6 py-4 text-sm font-semibold text-slate-800">
                                                            {isPurchase ? planLabel : t.simAsset}
                                                        </td>

                                                        <td className={`px-6 py-4 text-right font-extrabold text-sm ${
                                                            isPurchase ? 'text-emerald-600' : 'text-slate-600'
                                                        }`}>
                                                            {record.amount}
                                                        </td>

                                                        <td className="px-6 py-4 text-right text-sm font-mono font-bold text-slate-700">
                                                            {record.solAmount ? (
                                                                <span className="text-blue-600">
                                                                    {record.solAmount.toFixed(4)} SOL
                                                                </span>
                                                            ) : (
                                                                <span className="text-slate-400">—</span>
                                                            )}
                                                        </td>

                                                        <td className="px-6 py-4 text-center">
                                                            {record.hash && !record.hash.startsWith("LZ-") ? (
                                                                <a
                                                                    href={`https://solscan.io/tx/${record.hash}?cluster=devnet`}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg border border-blue-100 font-bold transition-all"
                                                                >
                                                                    <span>{t.viewBlock}</span>
                                                                    <ExternalLink className="w-3.5 h-3.5" />
                                                                </a>
                                                            ) : (
                                                                <span className="text-xs text-slate-400 font-medium">{t.internal}</span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
