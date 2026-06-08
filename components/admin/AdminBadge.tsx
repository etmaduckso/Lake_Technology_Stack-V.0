"use client";

import { useEffect, useState } from "react";
import { useWallet } from "@/context/wallet-context";
import { ShieldCheck, Loader2 } from "lucide-react";
import { useDict } from "@/lib/i18n/client";
import { getUserRole } from "@/app/actions/admin.actions";
import Link from "next/link";

export default function AdminBadge() {
    const { walletAddress } = useWallet();
    const dict = useDict();
    const [role, setRole] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const checkAdminStatus = async () => {
            if (!walletAddress) {
                setRole(null);
                return;
            }

            console.log("🕵️ [CLIENT] Iniciando verificação para:", walletAddress);
            setLoading(true);

            try {
                const data = await getUserRole(walletAddress);
                console.log("🕵️ [CLIENT] Resposta da Server Action:", data);

                if (data.success && data.role) {
                    setRole(data.role);
                } else {
                    setRole(null);
                }
            } catch (error) {
                console.error("🕵️ [CLIENT] Erro ao conectar na API:", error);
                setRole(null);
            } finally {
                setLoading(false);
            }
        };

        checkAdminStatus();
    }, [walletAddress]);

    if (!walletAddress) return null;
    if (!role && !loading) return null;

    return (
        <Link href="/dashboard/staff" className="flex items-center gap-2 px-3 py-1 ml-2 rounded-full bg-slate-900 border border-emerald-500/50 shadow-[0_0_10px_rgba(16,185,129,0.3)] hover:bg-slate-800 transition-colors">
            {loading ? (
                <Loader2 className="w-4 h-4 text-emerald-500 animate-spin" />
            ) : (
                <>
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold tracking-wider text-emerald-400 uppercase">
                        {role === "Master" ? dict.wallet.admin : role}
                    </span>
                </>
            )}
        </Link>
    );
}
