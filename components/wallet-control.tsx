"use client";

import { useState, useRef, useEffect } from "react";
import { useWallet } from "@/context/wallet-context";
import { useCredits } from "@/context/credits-context";
import { useNetworkHub } from "@/context/NetworkContext";
import {
  Copy,
  History,
  Shield,
  LogOut,
  Wallet,
  Coins,
  Plus,
  User,
} from "lucide-react";
import Link from "next/link";
import { useDict } from "@/lib/i18n/client";
import { useAdmin } from "@/hooks/useAdmin";

export function WalletControl() {
  const {
    walletAddress,
    connectWallet,
    disconnectWallet,
    isConnected,
    validationError,
  } = useWallet();
  const { credits, openModal } = useCredits();
  const {
    currentTier,
    userNetworkPreference,
    toggleNetworkPreference,
    isMainnet,
  } = useNetworkHub();
  const dict = useDict();
  const t = dict.wallet;
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const { isAdmin: isVipUser } = useAdmin(); // Use the existing hook to check VIP/Master mock list
  const [role, setRole] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    }

    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isDropdownOpen]);

  useEffect(() => {
    const fetchRole = async () => {
      if (!walletAddress) {
        setRole(null);
        return;
      }
      try {
        const { getUserRole } = await import("@/app/actions/admin.actions");
        const data = await getUserRole(walletAddress);
        if (data.success && data.role) {
          setRole(data.role);
        } else {
          setRole(null);
        }
      } catch (error) {
        console.error("Failed to fetch role", error);
        setRole(null);
      }
    };
    fetchRole();
  }, [walletAddress]);

  const handleCopyAddress = async () => {
    if (!walletAddress) return;

    try {
      await navigator.clipboard.writeText(walletAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy address:", error);
    }
  };

  const handleDisconnect = () => {
    setIsDropdownOpen(false);
    disconnectWallet();
  };

  const handleOpenCreditsModal = () => {
    setIsDropdownOpen(false);
    openModal();
  };

  const isMaster = role === "Master";
  const isStrictAdmin = role === "Admin";
  const hasOtherRole = role !== null && !isMaster && !isStrictAdmin;

  const showConsoleAdmin = isMaster || isStrictAdmin;
  const showVipProfile = isVipUser || hasOtherRole;

  if (!isConnected || !walletAddress) {
    return (
      <button
        onClick={connectWallet}
        className="
          px-6 py-2.5
          bg-gradient-to-r from-blue-600 to-blue-700
          hover:from-blue-700 hover:to-blue-800
          text-white font-semibold rounded-lg
          shadow-md hover:shadow-lg
          transition-all duration-200
          flex items-center gap-2
        "
      >
        <Wallet className="w-4 h-4" />
        {t.connect}
      </button>
    );
  }

  const truncatedAddress = `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`;

  return (
    <div className="relative flex items-center gap-2" ref={dropdownRef}>
      <button
        onClick={handleOpenCreditsModal}
        className="
                    px-3 py-2
                    bg-gradient-to-r from-blue-500 to-blue-600
                    hover:from-blue-600 hover:to-blue-700
                    text-white font-medium text-sm
                    rounded-lg
                    shadow-sm hover:shadow-md
                    transition-all duration-200
                    flex items-center gap-1.5
                "
        title={t.creditsTooltip}
      >
        <Coins className="w-4 h-4" />
        <span>{credits}</span>
        <Plus className="w-3 h-3 opacity-70" />
      </button>

      {isConnected && (
        <button
          onClick={currentTier === "CITIZEN" ? toggleNetworkPreference : undefined}
          disabled={currentTier !== "CITIZEN"}
          className={`
            px-2.5 py-1.5 rounded-lg text-xs font-bold font-mono transition-all duration-300 border
            ${
              isMainnet
                ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/30"
                : "bg-orange-500/20 text-orange-400 border-orange-500/30 hover:bg-orange-500/30"
            }
            ${currentTier !== "CITIZEN" ? "cursor-default opacity-85" : "cursor-pointer"}
          `}
          title={
            currentTier === "CITIZEN"
              ? `Rede ativa: ${isMainnet ? "Mainnet" : "Devnet"}. Clique para alterar.`
              : "Rede ativa: Devnet. Acesso restrito a Visitantes."
          }
        >
          {isMainnet ? "🟢 Mainnet" : "🟠 Devnet"}
        </button>
      )}

      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="
          px-4 py-2
          bg-slate-900 text-white
          font-mono text-sm font-medium
          rounded-lg
          border border-slate-700
          hover:bg-slate-800 hover:border-slate-600
          transition-all duration-200
          shadow-sm
        "
      >
        {truncatedAddress}
      </button>

      {isDropdownOpen && (
        <div
          className="
            absolute right-0 top-full mt-2 w-56
            bg-slate-950/95 border border-slate-800 backdrop-blur-md
            rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.5)]
            py-2
            z-50
            animate-in fade-in slide-in-from-top-2 duration-200
          "
        >
          <div className="px-4 py-2.5 border-b border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">{t.yourCredits}</span>
              <span className="font-extrabold text-emerald-400 text-sm">{credits} LKT</span>
            </div>
            {validationError && (
              <p className="mt-2 text-xs leading-relaxed text-amber-500">
                {validationError}
              </p>
            )}
          </div>

          <div className="px-4 py-2.5 border-b border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-400">Rede Ativa</span>
            <span className={`text-xs font-bold font-mono ${isMainnet ? "text-emerald-400" : "text-orange-400"}`}>
              {isMainnet ? "Mainnet" : "Devnet"}
            </span>
          </div>

          <button
            onClick={handleOpenCreditsModal}
            className="
              w-full px-4 py-2.5
              text-left text-sm text-slate-300
              hover:bg-slate-900/65 hover:text-white
              transition-colors
              flex items-center gap-3
            "
          >
            <Coins className="w-4 h-4 text-emerald-400" />
            <span>{t.buyCredits}</span>
          </button>

          <div className="h-px bg-slate-800 my-1" />

          <button
            onClick={handleCopyAddress}
            className="
              w-full px-4 py-2.5
              text-left text-sm text-slate-300
              hover:bg-slate-900/65 hover:text-white
              transition-colors
              flex items-center gap-3
            "
          >
            <Copy className="w-4 h-4 text-slate-400" />
            <span>{copied ? t.copied : t.copyAddress}</span>
          </button>

          <Link
            href="/history"
            onClick={() => setIsDropdownOpen(false)}
            className="
              w-full px-4 py-2.5
              text-left text-sm text-slate-300
              hover:bg-slate-900/65 hover:text-white
              transition-colors
              flex items-center gap-3
            "
          >
            <History className="w-4 h-4 text-slate-400" />
            <span>{t.txHistory}</span>
          </Link>

          {showConsoleAdmin && (
            <>
              <div className="h-px bg-slate-800 my-1" />
              <Link
                href="/dashboard/admin"
                onClick={() => setIsDropdownOpen(false)}
                className="
                  w-full px-4 py-2.5
                  text-left text-sm text-red-400 font-bold
                  hover:bg-red-500/10 hover:text-red-300
                  transition-colors
                  flex items-center gap-3
                "
              >
                <Shield className="w-4 h-4 text-red-400" />
                <span>Console Admin</span>
              </Link>
            </>
          )}

          {showVipProfile && (
            <>
              {!showConsoleAdmin && <div className="h-px bg-slate-800 my-1" />}
              <Link
                href="/dashboard/profile"
                onClick={() => setIsDropdownOpen(false)}
                className="
                  w-full px-4 py-2.5
                  text-left text-sm text-emerald-400 font-bold
                  hover:bg-emerald-500/10 hover:text-emerald-300
                  transition-colors
                  flex items-center gap-3
                "
              >
                <User className="w-4 h-4 text-emerald-400" />
                <span>Perfil VIP</span>
              </Link>
            </>
          )}

          <div className="h-px bg-slate-800 my-1" />

          <button
            onClick={handleDisconnect}
            className="
              w-full px-4 py-2.5
              text-left text-sm text-slate-400 hover:text-red-400
              hover:bg-slate-900/60
              transition-colors
              flex items-center gap-3
            "
          >
            <LogOut className="w-4 h-4 text-slate-500 hover:text-red-400" />
            <span>{t.disconnect}</span>
          </button>
        </div>
      )}
    </div>
  );
}
