"use client";
import { useState, useEffect, useCallback } from "react";
import { Search, TrendingUp, Briefcase, Trash2, Loader2, AlertTriangle, ShieldCheck, X, Zap, Coins, Lock, ExternalLink, ChevronRight, Store } from "lucide-react";
import { useConnection, useWallet as useSolanaWallet } from "@solana/wallet-adapter-react";
import { useCredits } from "@/context/credits-context";
import { useNetworkHub } from "@/context/NetworkContext";
import { SystemProgram, Transaction, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { CurrencyDisplay } from "@/components/ui/CurrencyDisplay";
import { useDict } from "@/lib/i18n/client";
import { useRequireWallet } from "@/hooks/useRequireWallet";

const DEMO_ASSETS = [
  { id: "demo-1", name: "Edifício Faria Lima Prime", type: "Real Estate", price: 1200, yield: "12.5% a.a.", available: "45%", image: "bg-blue-900", locked: false, isDemo: true, ownerWallet: null },
  { id: "demo-2", name: "Usinas Solares Bahia I", type: "Energia Renovável", price: 850, yield: "14.2% a.a.", available: "12%", image: "bg-amber-600", locked: false, isDemo: true, ownerWallet: null },
];

interface AssetItem {
  id: string;
  name: string;
  type: string;
  price?: number;
  yield?: string;
  available?: string;
  image: string;
  locked: boolean;
  isDemo?: boolean;
  isUserAsset?: boolean;
  ownerWallet: string | null;
  status?: string;
  description?: string;
  tokensAvailable?: number;
  totalTokens?: number;
  valuation?: number;
  isListed?: boolean;
  contractUrl?: string | null;
}

// ─── Modal de Investimento Secundário ────────────────────────────────────────────────────
function SecondaryInvestModal({ receipt, onClose, onRefresh }: { receipt: any; onClose: () => void, onRefresh: () => void }) {
  const { connection } = useConnection();
  const { sendTransaction, publicKey } = useSolanaWallet();
  const { solPrice, refreshSolPrice } = useCredits();
  const { isMainnet } = useNetworkHub();
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);

  const asset = receipt.asset;
  const resalePriceBRL = Number(receipt.resalePrice || 0);
  const qty = receipt.quantity;
  const originalCreatorWallet = asset.ownerWallet;
  
  const totalBRLValue = qty * resalePriceBRL;
  const totalBRL = totalBRLValue.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  
  // Royalties calculation (let's assume standard 2.5% for demo, or asset.royalties if exists)
  const royaltiesPercent = 0.025; 
  const royaltiesBRL = totalBRLValue * royaltiesPercent;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 fade-in duration-200">

        <div className="relative w-full h-32 bg-amber-50 flex items-center justify-center overflow-hidden rounded-t-xl border-b border-amber-100 shrink-0">
          <div className="absolute inset-0 flex flex-col justify-center items-center z-10 p-6">
            <Store className="w-8 h-8 text-amber-500 mb-2" />
            <h2 className="text-amber-900 text-2xl font-extrabold leading-tight text-center">Mercado Secundário</h2>
            <p className="text-amber-700 text-xs font-bold uppercase tracking-widest mt-1">Compra de Lote Privado</p>
          </div>
          <button onClick={onClose} className="absolute top-3 right-3 p-1.5 rounded-xl bg-black/10 hover:bg-black/20 text-black transition-colors z-10">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div className="text-center">
            <h3 className="text-lg font-bold text-slate-800">{asset.name}</h3>
            <p className="text-xs text-slate-500 mt-1">Vendedor: {receipt.investorWallet.slice(0, 4)}...{receipt.investorWallet.slice(-4)}</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-center">
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1">Preço Unitário</p>
              <p className="text-xl font-extrabold text-slate-900 leading-none">
                {resalePriceBRL.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              </p>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-center">
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1">Lote Fechado</p>
              <p className="text-xl font-extrabold text-slate-900 leading-none">{qty} Tokens</p>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
             <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-slate-500">Subtotal do Lote</span>
                <span className="text-sm font-bold text-slate-800">{totalBRL}</span>
             </div>
             <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-slate-400 flex items-center gap-1"><ShieldCheck className="w-3 h-3"/> Royalties do Criador (2.5%)</span>
                <span className="text-xs font-bold text-slate-600">{royaltiesBRL.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span>
             </div>
          </div>

          <div className="bg-gradient-to-r from-violet-50 to-indigo-50 border border-violet-200 rounded-2xl p-4 flex items-start gap-3">
            <div className="p-2 bg-violet-100 rounded-xl shrink-0">
              <Coins className="w-5 h-5 text-violet-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-violet-800">Taxa Secundária Lake</p>
              <p className="text-xs text-violet-600 mt-0.5">Esta transação P2P consome <strong>5 Créditos Lake</strong> e <strong>$1.00 USD</strong> (em SOL).</p>
            </div>
          </div>

          <button
            disabled={isProcessing}
            onClick={async () => {
              if (!publicKey) {
                alert("Conecte sua carteira para comprar.");
                return;
              }
              setIsProcessing(true);
              try {
                let currentPrice = solPrice;
                if (!currentPrice || currentPrice <= 0) {
                  currentPrice = await refreshSolPrice();
                }
                if (!currentPrice || currentPrice <= 0) {
                  throw new Error("Falha ao obter cotação do SOL.");
                }

                // Valores em SOL
                const sellerSol = totalBRLValue / currentPrice;
                const platformSol = 1.00 / currentPrice;
                const royaltiesSol = royaltiesBRL / currentPrice;

                const SELLER_L = Math.floor(sellerSol * LAMPORTS_PER_SOL);
                const PLATFORM_L = Math.floor(platformSol * LAMPORTS_PER_SOL);
                const ROYALTIES_L = Math.floor(royaltiesSol * LAMPORTS_PER_SOL);

                const targetPubKeyStr = isMainnet
                  ? (process.env.NEXT_PUBLIC_LIQUIDITY_RECEIVER_WALLET || "8DzctwAnUeXTy2xbUz1z5nfr3xfqCWYCxYAVTni7XvRH")
                  : (process.env.NEXT_PUBLIC_TREASURY_WALLET_ADDRESS || "CXqfj7vFFrpBMVaj8fuyQkGwFgHktdyYVDju723hnmWa");
                const treasuryPubKey = new PublicKey(targetPubKeyStr);
                const sellerPubKey = new PublicKey(receipt.investorWallet);
                const transaction = new Transaction();

                // Instrução 1: Vendedor
                transaction.add(
                  SystemProgram.transfer({
                    fromPubkey: publicKey,
                    toPubkey: sellerPubKey,
                    lamports: SELLER_L,
                  })
                );

                // Instrução 2: Tesouraria Lake
                transaction.add(
                  SystemProgram.transfer({
                    fromPubkey: publicKey,
                    toPubkey: treasuryPubKey,
                    lamports: PLATFORM_L,
                  })
                );

                // Instrução 3: Criador (Royalties)
                if (originalCreatorWallet && originalCreatorWallet !== receipt.investorWallet) {
                   const creatorPubKey = new PublicKey(originalCreatorWallet);
                   transaction.add(
                    SystemProgram.transfer({
                      fromPubkey: publicKey,
                      toPubkey: creatorPubKey,
                      lamports: ROYALTIES_L,
                    })
                  );
                }

                const latestBlockhash = await connection.getLatestBlockhash("confirmed");
                transaction.recentBlockhash = latestBlockhash.blockhash;
                transaction.feePayer = publicKey;

                const signature = await sendTransaction(transaction, connection);
                
                await connection.confirmTransaction({
                  signature,
                  blockhash: latestBlockhash.blockhash,
                  lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
                }, "confirmed");

                // Backend sync
                const res = await fetch("/api/invest/secondary-buy", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    buyerWallet: publicKey.toBase58(),
                    receiptId: receipt.id,
                    transactionSignature: signature,
                    totalSolPaid: sellerSol + platformSol + royaltiesSol
                  }),
                });

                const data = await res.json();
                if (!res.ok) throw new Error(data.error);

                alert("Lote Secundário adquirido com sucesso! Verifique seu Dashboard do Investidor.");
                onRefresh();
                router.refresh();
                onClose();

              } catch (err: any) {
                console.error("[SecondaryBuy]", err);
                alert(`Erro na compra P2P: ${err.message}`);
              } finally {
                setIsProcessing(false);
              }
            }}
            className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white font-extrabold rounded-xl text-lg flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-xl disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isProcessing ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <Store className="w-5 h-5" />
            )}
            {isProcessing ? "Processando Transação (0/2)..." : "Comprar Lote P2P"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Modal de Investimento Primário ────────────────────────────────────────────────────
function InvestModal({ asset, onClose }: { asset: AssetItem; onClose: () => void }) {
  const { connection } = useConnection();
  const { sendTransaction, publicKey } = useSolanaWallet();
  const { solPrice, refreshSolPrice, addTransactionRecord } = useCredits();
  const { isMainnet } = useNetworkHub();
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);

  const tokenPriceBRL = asset.price ?? 0;
  const maxQty = asset.tokensAvailable ?? 0;
  const [qty, setQty] = useState(1);
  
  const RATE_USDC_BRL = 5.10;
  const RATE_SOL_BRL = 850.0;

  const tokenPriceUSDC = (tokenPriceBRL / RATE_USDC_BRL).toFixed(2);
  const tokenPriceSOL = (tokenPriceBRL / RATE_SOL_BRL).toFixed(4);

  const totalBRLValue = qty * tokenPriceBRL;
  const totalBRL = totalBRLValue.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const totalUSDC = (totalBRLValue / RATE_USDC_BRL).toFixed(2);
  const totalSOL = (totalBRLValue / RATE_SOL_BRL).toFixed(4);

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 fade-in duration-200">

        {asset.image && asset.image.startsWith("https://") ? (
          <div className="relative w-full h-48 bg-slate-50 flex items-center justify-center overflow-hidden rounded-t-xl border-b border-slate-100 shrink-0">
            <Image src={asset.image} alt="Asset RWA" fill className="object-contain p-4" />
            <button onClick={onClose} className="absolute top-3 right-3 p-1.5 rounded-xl bg-black/40 hover:bg-black/60 text-white transition-colors z-10"><X className="w-4 h-4" /></button>
          </div>
        ) : (
          <div className={`h-24 w-full ${asset.image} flex items-center px-6 justify-between`}>
            <div><h2 className="text-white text-xl font-extrabold">{asset.name}</h2></div>
            <button onClick={onClose} className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"><X className="w-4 h-4" /></button>
          </div>
        )}

        <div className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1">Preço por Token</p>
              <p className="text-2xl font-extrabold text-slate-900 leading-none">{tokenPriceBRL.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</p>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col justify-center">
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1">Inventário</p>
              <p className="text-sm text-slate-700 mt-2">Disponível: <span className="font-bold">{asset.tokensAvailable?.toLocaleString() || "100%"}</span></p>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-3">Quantidade de Tokens</p>
            <div className="flex items-center gap-3">
              <button onClick={() => setQty(q => Math.max(1, q - 1))} className="w-10 h-10 rounded-xl bg-white border border-slate-300 font-bold text-slate-700 hover:bg-slate-100 transition-colors text-lg flex items-center justify-center">−</button>
              <span className="flex-1 text-center text-2xl font-extrabold text-slate-900">{qty}</span>
              <button disabled={qty >= maxQty} onClick={() => setQty(q => Math.min(maxQty, q + 1))} className={`w-10 h-10 rounded-xl bg-white border border-slate-300 font-bold text-slate-700 transition-colors text-lg flex items-center justify-center ${qty >= maxQty ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-100'}`}>+</button>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-200 flex justify-between items-end">
              <span className="text-sm text-slate-500 font-medium">Total estimado</span>
              <div className="text-right">
                <span className="block text-2xl font-extrabold text-slate-900 leading-none">{totalBRL}</span>
              </div>
            </div>
          </div>

          <button
            onClick={async () => {
              if (!publicKey) return;
              setIsProcessing(true);
              try {
                let currentPrice = solPrice;
                if (!currentPrice || currentPrice <= 0) currentPrice = await refreshSolPrice();
                if (!currentPrice || currentPrice <= 0) throw new Error("Falha ao obter cotação do SOL.");

                const exactFeeSol = 1.00 / currentPrice;
                const PLATFORM_FEE_L = Math.floor(exactFeeSol * 1.01 * LAMPORTS_PER_SOL);

                const exactAssetSol = totalBRLValue / currentPrice;
                const ASSET_COST_L = Math.floor(exactAssetSol * 1.01 * LAMPORTS_PER_SOL);
                const totalSolAmount = (PLATFORM_FEE_L + ASSET_COST_L) / LAMPORTS_PER_SOL;

                const targetPubKeyStr = isMainnet
                  ? (process.env.NEXT_PUBLIC_LIQUIDITY_RECEIVER_WALLET || "8DzctwAnUeXTy2xbUz1z5nfr3xfqCWYCxYAVTni7XvRH")
                  : (process.env.NEXT_PUBLIC_TREASURY_WALLET_ADDRESS || "CXqfj7vFFrpBMVaj8fuyQkGwFgHktdyYVDju723hnmWa");
                const treasuryPubKey = new PublicKey(targetPubKeyStr);
                const ownerPubKey = new PublicKey(asset.ownerWallet || treasuryPubKey.toBase58());

                const transaction = new Transaction();
                transaction.add(SystemProgram.transfer({ fromPubkey: publicKey, toPubkey: treasuryPubKey, lamports: PLATFORM_FEE_L }));
                transaction.add(SystemProgram.transfer({ fromPubkey: publicKey, toPubkey: ownerPubKey, lamports: ASSET_COST_L }));

                const latestBlockhash = await connection.getLatestBlockhash("confirmed");
                transaction.recentBlockhash = latestBlockhash.blockhash;
                transaction.feePayer = publicKey;

                const signature = await sendTransaction(transaction, connection);
                
                await connection.confirmTransaction({ signature, blockhash: latestBlockhash.blockhash, lastValidBlockHeight: latestBlockhash.lastValidBlockHeight }, "confirmed");

                const res = await fetch("/api/invest", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    walletAddress: publicKey.toBase58(),
                    transactionSignature: signature,
                    cryptoAmount: totalSolAmount,
                    quantity: qty,
                    assetId: asset.id,
                  }),
                });

                const data = await res.json();
                if (!res.ok) throw new Error(data.error);

                addTransactionRecord({ id: Date.now().toString(), type: "USO", amount: "-5 Créditos", hash: signature, date: new Date().toLocaleString("pt-BR"), planId: `Investimento: ${asset.name}`, solAmount: totalSolAmount });
                alert("🎉 Investimento efetuado!");
                router.refresh();
                onClose();

              } catch (err: any) {
                alert(`Erro: ${err.message}`);
              } finally {
                setIsProcessing(false);
              }
            }}
            className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white font-extrabold rounded-xl text-lg flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-xl"
          >
            {isProcessing ? <Loader2 className="w-6 h-6 animate-spin" /> : <TrendingUp className="w-5 h-5" />}
            {isProcessing ? "Processando..." : "Confirmar Investimento"}
          </button>
        </div>
      </div>
    </div>
  );
}

function buildArweaveUrl(contractUrl: string | null | undefined): string | null {
  if (!contractUrl) return null;
  const t = contractUrl.trim();
  if (t.startsWith("https://") || t.startsWith("http://")) return t;
  return `https://gateway.irys.xyz/${t}`;
}

function AssetCardSkeleton() {
  return (
    <div className="bg-[#f5f3ef] dark:bg-[#1c1b18] border border-[#dbd7c9] dark:border-[#2e2c26] rounded-xl overflow-hidden shadow-sm flex flex-col h-[400px] animate-pulse">
      <div className="w-full h-48 bg-[#ede9df] dark:bg-zinc-950" />
      <div className="p-6 flex-1 flex flex-col justify-between">
        <div className="space-y-3">
          <div className="h-5 bg-slate-300 dark:bg-zinc-800 rounded w-3/4 animate-pulse" />
          <div className="h-3 bg-slate-300 dark:bg-zinc-800 rounded w-1/2 animate-pulse" />
          <div className="grid grid-cols-2 gap-4 pt-4">
            <div>
              <div className="h-2 bg-slate-200 dark:bg-zinc-800 rounded w-1/3 mb-1 animate-pulse" />
              <div className="h-4 bg-slate-300 dark:bg-zinc-800 rounded w-2/3 animate-pulse" />
            </div>
            <div>
              <div className="h-2 bg-slate-200 dark:bg-zinc-800 rounded w-1/3 mb-1 animate-pulse" />
              <div className="h-4 bg-slate-300 dark:bg-zinc-800 rounded w-2/3 animate-pulse" />
            </div>
          </div>
        </div>
        <div className="h-10 bg-slate-300 dark:bg-zinc-800 rounded w-full mt-4 animate-pulse" />
      </div>
    </div>
  );
}

function AssetCard({
  asset,
  connectedWallet,
  onInvestClick,
  onDeleteClick,
  onApproveClick,
  requireWallet,
}: {
  asset: AssetItem;
  connectedWallet: string | null;
  onInvestClick: (asset: AssetItem) => void;
  onDeleteClick: (asset: AssetItem) => void;
  onApproveClick: (id: string) => void;
  requireWallet: (cb: () => void) => void;
}) {
  const [arweaveData, setArweaveData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(!asset.isDemo && !!asset.contractUrl);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (asset.isDemo || !asset.contractUrl) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    const url = buildArweaveUrl(asset.contractUrl);

    if (url) {
      fetch(url)
        .then((res) => {
          if (!res.ok) throw new Error("Erro no fetch");
          return res.json();
        })
        .then((data) => {
          if (isMounted) {
            setArweaveData(data);
            setIsLoading(false);
          }
        })
        .catch((err) => {
          console.warn("[Marketplace Card] Falha ao carregar do Arweave:", err);
          if (isMounted) {
            setHasError(true);
            setIsLoading(false);
          }
        });
    } else {
      setIsLoading(false);
    }

    return () => {
      isMounted = false;
    };
  }, [asset.isDemo, asset.contractUrl]);

  if (isLoading) {
    return <AssetCardSkeleton />;
  }

  // Resolve metadata (Arweave has precedence, DB as fallback)
  const name = arweaveData?.name || asset.name;
  const sector = arweaveData?.sector || arweaveData?.tokenNature || asset.type;
  
  // Format values
  const price = arweaveData?.tokenPrice 
    ? Number(arweaveData.tokenPrice) 
    : asset.price || 0;
  
  const valuation = arweaveData?.valuation
    ? Number(arweaveData.valuation)
    : asset.valuation || 0;

  // Resolve Cover Image URL
  const rawImage = arweaveData?.imageUrl || asset.image;
  const imageUrl = rawImage && !rawImage.startsWith("bg-")
    ? buildArweaveUrl(rawImage)
    : null;

  const isDemoBg = rawImage && rawImage.startsWith("bg-");
  const isMyAsset = connectedWallet !== null && asset.ownerWallet === connectedWallet;

  const handleInvest = () => {
    onInvestClick({
      ...asset,
      name,
      type: sector,
      price,
      image: imageUrl || rawImage || "",
      valuation,
    });
  };

  return (
    <div className="group bg-[#f5f3ef] dark:bg-[#1c1b18] border border-[#dbd7c9] dark:border-[#2e2c26] rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col">
      {imageUrl ? (
        <div className="relative w-full h-48 bg-[#ede9df] dark:bg-zinc-950 flex items-center justify-center overflow-hidden border-b border-[#dbd7c9] dark:border-[#2e2c26]">
          <img src={imageUrl} alt={name} className="object-contain p-4 w-full h-full" />
          {isMyAsset && !asset.isDemo && (
            <div className="absolute top-3 right-3 z-10">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteClick(asset);
                }}
                title="Excluir Ativo"
                className="p-2 rounded-lg bg-white/90 text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors shadow-sm"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className={`relative h-48 w-full shrink-0 flex items-center justify-center ${isDemoBg ? rawImage : "bg-slate-700"}`}>
          {isDemoBg && <span className="text-white font-extrabold text-lg drop-shadow">{name}</span>}
          {isMyAsset && !asset.isDemo && (
            <div className="absolute top-3 right-3 z-10">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteClick(asset);
                }}
                title="Excluir Ativo"
                className="p-2 rounded-lg bg-white/90 text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors shadow-sm"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}
      <div className="p-6 flex-1 flex flex-col">
        <h3 className="text-lg font-bold mb-1 truncate text-slate-900 dark:text-zinc-50">{name}</h3>
        <p className="text-xs text-slate-500 font-medium mb-4">{sector}</p>
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase">Preço</p>
            <p className="font-extrabold text-slate-900 dark:text-zinc-50">
              {price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase">Rendimento</p>
            <p className="font-extrabold text-emerald-600">{asset.yield || "12.0% a.a."}</p>
          </div>
        </div>
        <div className="mt-auto">
          {isMyAsset ? (
            asset.status === "APPROVED" || asset.status === "ACTIVE" || asset.status === "TOKENIZED" ? (
              <Link
                href={`/dashboard/manage/${asset.id}`}
                className="w-full block text-center py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-sm transition-colors shadow-sm"
              >
                Gerenciar Ativo
              </Link>
            ) : (
              <div className="flex gap-2">
                <Link
                  href={`/dashboard/manage/${asset.id}`}
                  className="flex-1 block text-center py-3 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-lg text-sm transition-colors shadow-sm"
                >
                  Gerenciar
                </Link>
                <button
                  onClick={() => onApproveClick(asset.id)}
                  className="px-4 py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-lg text-sm transition-colors shadow-sm flex-1"
                >
                  Aprovar
                </button>
              </div>
            )
          ) : (
            <button
              disabled={(asset.tokensAvailable || 0) <= 0}
              onClick={() => requireWallet(handleInvest)}
              className={`w-full py-3 font-bold rounded-lg text-sm transition-colors ${
                (asset.tokensAvailable || 0) <= 0
                  ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                  : "bg-slate-900 hover:bg-slate-800 text-white"
              }`}
            >
              {(asset.tokensAvailable || 0) <= 0 ? "Esgotado" : "Investir no Emissor"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Componente Principal ────────────────────────────────────────────────────
export default function MarketplacePage() {
  const [activeFilter, setActiveFilter] = useState("Mercado Primário");
  const [searchQuery, setSearchQuery] = useState("");
  const { publicKey } = useSolanaWallet();
  const connectedWallet = publicKey?.toBase58() || null;
  const requireWallet = useRequireWallet();

  const [assets, setAssets] = useState<AssetItem[]>(DEMO_ASSETS);
  const [secondaryReceipts, setSecondaryReceipts] = useState<any[]>([]);
  const [isLoadingAssets, setIsLoadingAssets] = useState(true);

  const [investTarget, setInvestTarget] = useState<AssetItem | null>(null);
  const [secondaryInvestTarget, setSecondaryInvestTarget] = useState<any | null>(null);
  const [isCanceling, setIsCanceling] = useState<string | null>(null);

  const fetchPrimaryAssets = useCallback(async () => {
    try {
      const url = connectedWallet ? `/api/assets?wallet=${encodeURIComponent(connectedWallet)}` : `/api/assets`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.assets) {
        const dbAssets: AssetItem[] = data.assets.map((a: any) => ({
          id: a.id, name: a.name, type: a.type, price: Number(a.tokenPrice) || Number(a.valuation) / 1000,
          yield: "12.0% a.a.", available: "100%", image: a.imageUrl || "bg-slate-700", locked: false,
          isUserAsset: true, ownerWallet: a.ownerWallet, status: a.status, description: a.description,
          tokensAvailable: a.marketTokens || 0, totalTokens: a.totalTokens || 0, valuation: Number(a.valuation) || 0,
          isListed: a.isListed !== false,
          contractUrl: a.contractUrl,
        }));
        setAssets([...dbAssets, ...DEMO_ASSETS]);
      }
    } catch (err) {
      setAssets(DEMO_ASSETS);
    } finally {
      setIsLoadingAssets(false);
    }
  }, [connectedWallet]);

  const fetchSecondaryAssets = useCallback(async () => {
    try {
      const res = await fetch('/api/marketplace/secondary');
      const data = await res.json();
      if (data.receipts) setSecondaryReceipts(data.receipts);
    } catch (err) {}
  }, []);

  useEffect(() => {
    fetchPrimaryAssets();
    fetchSecondaryAssets();
  }, [fetchPrimaryAssets, fetchSecondaryAssets]);

  const isMyAsset = (owner: string | null) => connectedWallet !== null && owner === connectedWallet;

  const handleCancelResale = async (receiptId: string) => {
    if (!connectedWallet) return;
    if (!window.confirm("Deseja retirar este lote do Mercado Secundário e devolvê-lo à sua carteira?")) return;
    
    setIsCanceling(receiptId);
    try {
      const res = await fetch("/api/invest/cancel-resale", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiptId, walletAddress: connectedWallet })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      alert("Venda cancelada. O lote retornou ao seu Dashboard HELD.");
      fetchSecondaryAssets();
    } catch (err: any) {
      alert(`Erro: ${err.message}`);
    } finally {
      setIsCanceling(null);
    }
  };

  const handleDeleteAsset = async (asset: AssetItem) => {
    if (!window.confirm(`Deseja excluir permanentemente o ativo "${asset.name}"?`)) return;
    try {
      const res = await fetch(`/api/assets/${asset.id}?wallet=${connectedWallet}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao deletar ativo");
      alert("Ativo deletado com sucesso!");
      fetchPrimaryAssets();
    } catch (err: any) {
      alert(`Erro: ${err.message}`);
    }
  };

  const handleForceApproval = async (id: string) => {
    if (!window.confirm("Deseja aprovar e publicar este ativo no mercado primário?")) return;
    try {
      const res = await fetch(`/api/assets/${id}?wallet=${connectedWallet}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "APPROVED" }),
      });
      if (!res.ok) throw new Error("Falha ao aprovar");
      alert("Ativo Aprovado com Sucesso!");
      fetchPrimaryAssets();
    } catch (err: any) {
      alert(`Erro: ${err.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <div className="bg-white border-b border-slate-200 pt-12 pb-8 px-6">
        <h1 className="text-3xl font-bold">Marketplace</h1>
      </div>

      <div className="sticky top-20 z-30 bg-slate-50/95 backdrop-blur-sm border-b border-slate-200 py-4 px-6 flex flex-wrap justify-between gap-3">
        <div className="flex gap-2 flex-wrap">
          {["Mercado Primário", "Mercado Secundário"].map(f => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
                activeFilter === f ? "bg-slate-900 text-white shadow-md" : "bg-white border border-slate-200 hover:border-slate-400"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="container mx-auto px-6 py-12">
        {isLoadingAssets ? (
          <div className="flex justify-center items-center py-24"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {activeFilter === "Mercado Primário" ? (
              assets
              .filter(a => {
                // No mercado primário público, mostrar apenas listados e APPROVED ou TOKENIZED (ou demos)
                if (a.isDemo) return true;
                return (a.status === "APPROVED" || a.status === "TOKENIZED") && a.isListed !== false;
              })
              .map(asset => (
                <AssetCard
                  key={asset.id}
                  asset={asset}
                  connectedWallet={connectedWallet}
                  onInvestClick={setInvestTarget}
                  onDeleteClick={handleDeleteAsset}
                  onApproveClick={handleForceApproval}
                  requireWallet={requireWallet}
                />
              ))
            ) : null}

            {activeFilter === "Mercado Secundário" ? (
              secondaryReceipts.length === 0 ? (
                <div className="col-span-3 text-center py-20 text-slate-500 font-medium">Nenhum ativo listado no mercado secundário.</div>
              ) : (
                secondaryReceipts.map((receipt) => (
                  <div key={receipt.id} className="group bg-white border-2 border-amber-100 rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col">
                    <div className="bg-amber-50 py-3 px-4 flex justify-between items-center border-b border-amber-100">
                      <span className="text-xs font-bold text-amber-700 flex items-center gap-1"><Store className="w-3 h-3"/> Mercado Secundário</span>
                      <span className="text-[10px] text-amber-600/70 font-mono">P2P LOTE</span>
                    </div>
                    <div className="p-6 flex-1 flex flex-col">
                      <h3 className="text-lg font-bold mb-1 truncate">{receipt.asset.name}</h3>
                      <p className="text-xs text-slate-500 font-medium mb-4">Vendedor: {receipt.investorWallet.slice(0, 4)}...{receipt.investorWallet.slice(-4)}</p>
                      <div className="grid grid-cols-2 gap-4 mb-6 bg-slate-50 p-3 rounded-lg border border-slate-100">
                        <div><p className="text-[10px] text-slate-400 font-bold uppercase">Preço Unitário</p><p className="font-extrabold text-slate-900">{Number(receipt.resalePrice).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</p></div>
                        <div><p className="text-[10px] text-slate-400 font-bold uppercase">Lote Ofertado</p><p className="font-extrabold text-indigo-600">{receipt.quantity} Tokens</p></div>
                      </div>
                      <div className="mt-auto">
                        {isMyAsset(receipt.investorWallet) ? (
                          <button onClick={() => handleCancelResale(receipt.id)} disabled={isCanceling === receipt.id} className="w-full py-3 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-lg text-sm border border-red-200 transition-colors">
                            {isCanceling === receipt.id ? "Cancelando..." : "Cancelar Venda"}
                          </button>
                        ) : (
                          <button onClick={() => requireWallet(() => setSecondaryInvestTarget(receipt))} className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-lg text-sm transition-colors shadow-sm">Comprar Lote P2P</button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )
            ) : null}

          </div>
        )}
      </div>

      {investTarget && <InvestModal asset={investTarget} onClose={() => setInvestTarget(null)} />}
      {secondaryInvestTarget && <SecondaryInvestModal receipt={secondaryInvestTarget} onClose={() => setSecondaryInvestTarget(null)} onRefresh={fetchSecondaryAssets} />}
    </div>
  );
}