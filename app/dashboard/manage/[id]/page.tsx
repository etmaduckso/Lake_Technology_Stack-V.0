"use client";

import { useEffect, useState, use, useRef, useCallback } from "react";
import {
  ArrowLeft, Loader2, Briefcase, DollarSign, Share2, Layers,
  ExternalLink, ShieldCheck, BarChart2, CheckCircle2, Sliders,
  AlertTriangle, Zap, FileText, Upload, X, RefreshCw,
  CheckCircle, AlertCircle, Settings, Play, Wallet,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useWallet as useSolanaWallet, useConnection } from "@solana/wallet-adapter-react";
import { SystemProgram, Transaction, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { useRouter } from "next/navigation";
import { CurrencyDisplay } from "@/components/ui/CurrencyDisplay";
import { useCredits } from "@/context/credits-context";
import { useMedals } from "@/context/medals-context";
import { useWallet } from "@/context/wallet-context";
import { toast } from "sonner";
import {
  loadDraftMeta, loadDraftImageBlob, loadDraftPdfBlob,
  clearDraft, PAYMENT_TX_KEY, META_KEY,
  type DraftMeta,
} from "@/lib/storage/draft-store";

// ─── Constantes ───────────────────────────────────────────────────────────────
const TREASURY_FEE_USD = 0.5;
const IRYS_GATEWAY = "https://gateway.irys.xyz";

// ─── Tipos ────────────────────────────────────────────────────────────────────
interface AssetData {
  id: string; name: string; type: string; sector?: string; tokenNature?: string;
  valuation: string; tokenPrice: string; totalTokens: number;
  treasuryTokens?: number; marketTokens?: number; tokensAvailable?: number;
  royalties?: number; status: string; ownerWallet: string; createdAt: string;
  description?: string | null; imageUrl?: string | null; contractUrl?: string | null;
  isListed?: boolean;
}

interface ArweaveJsonMaster {
  name?: string; sector?: string; tokenNature?: string; description?: string;
  valuation?: number | string; tokenPrice?: number | string;
  totalTokens?: number | string; treasuryTokens?: number | string;
  royalties?: number | string; imageUrl?: string;
  contractUrl?: string | null; paymentTxHash?: string;
  platform?: string; createdAt?: string; schemaVersion?: string;
  image?: string; pdf?: string;
}

interface LedgerEntry {
  id: string;
  date: string;
  quantity: number;
  value: number;
  hash?: string | null;
  status: string;
}

interface FinancialsData {
  tokensSold: number;
  revenueRaised: number;
  royaltiesGenerated: number;
  ledger: LedgerEntry[];
  pagination: {
    page: number;
    totalPages: number;
    total: number;
    limit: number;
  };
}

type MintingPhase =
  | "idle" | "paying" | "paid"
  | "uploading_image" | "uploading_pdf" | "uploading_json"
  | "saving" | "success" | "error";

interface PageProps { params: Promise<{ id: string }>; }

// ─── Helpers ──────────────────────────────────────────────────────────────────

function safeNum(val: number | string | undefined | null, fallback = 0): number {
  const n = Number(val ?? fallback);
  return isNaN(n) ? fallback : n;
}

function safeStr(val: string | undefined | null, fallback = "—"): string {
  return val?.trim() || fallback;
}

function buildArweaveUrl(contractUrl: string | null | undefined): string | null {
  if (!contractUrl) return null;
  const t = contractUrl.trim();
  if (t.startsWith("https://") || t.startsWith("http://")) return t;
  return `${IRYS_GATEWAY}/${t}`;
}

function getMintLabel(phase: MintingPhase, hasPdf: boolean): string {
  switch (phase) {
    case "paying":           return "Etapa 1/2 — Processamento de custódia securitária digital na rede de registros Solana...";
    case "paid":             return "Compromisso de custódia e taxa regulatória processados com sucesso ✅";
    case "uploading_image":  return "Etapa 2/2 — Sincronização e auditoria do registro visual imutável da imagem de capa...";
    case "uploading_pdf":    return hasPdf ? "Registrando contrato digital oficial e termos de viabilidade comercial no Arweave..." : "Compondo livro-razão consolidado do ativo...";
    case "uploading_json":   return "Eternizando livro-razão digital consolidado do ativo no Arweave...";
    case "saving":           return "Sincronizando parâmetros de tokenomics com o livro-razão institucional...";
    case "success":          return "Registro Regulatório Concluído com Sucesso! 🎉";
    default:                 return "";
  }
}

// ─── Componente Principal ──────────────────────────────────────────────────────
export default function ManageAssetPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const isDraft = id === "draft";

  const { walletAddress } = useWallet();
  const solanaWallet = useSolanaWallet();
  const { publicKey, connected } = solanaWallet;
  const { connection } = useConnection();
  const { solPrice, refreshSolPrice, addTransactionRecord } = useCredits();
  const { award: awardMedal } = useMedals();

  // ─── Dados ─────────────────────────────────────────────────────────────────
  const [meta, setMeta]                     = useState<DraftMeta | null>(null);
  const [imageObjectUrl, setImageObjectUrl] = useState<string | null>(null);
  const [pdfBlobForMint, setPdfBlobForMint] = useState<Blob | null>(null);

  const [asset, setAsset]             = useState<AssetData | null>(null);
  const [arweaveData, setArweaveData] = useState<ArweaveJsonMaster | null>(null);
  const [financials, setFinancials]   = useState<FinancialsData | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [page, setPage]           = useState(1);

  // ─── UI Live ───────────────────────────────────────────────────────────────
  const [isTogglingList, setIsTogglingList] = useState(false);
  const [isEditingDesc, setIsEditingDesc]   = useState(false);
  const [editDescription, setEditDescription] = useState("");
  const [isSavingDesc, setIsSavingDesc]     = useState(false);
  const [dividendPct, setDividendPct]       = useState("8.5");
  const [isSimulating, setIsSimulating]     = useState(false);
  const [simulatedPayout, setSimulatedPayout] = useState<number | null>(null);

  // ─── Modal de Edição (DRAFT) ────────────────────────────────────────────────
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editSector, setEditSector] = useState("");
  const [editValuation, setEditValuation] = useState(0);
  const [editTokenPrice, setEditTokenPrice] = useState(0);
  const [editTotalTokens, setEditTotalTokens] = useState(0);
  const [editTreasuryTokens, setEditTreasuryTokens] = useState(0);
  const [editRoyalties, setEditRoyalties] = useState(0);
  const [editDescText, setEditDescText] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const handleOpenEditModal = () => {
    if (isDraft) {
      if (!meta) return;
      setEditName(meta.name || "");
      setEditSector(meta.sector || "");
      setEditValuation(meta.valuation || 0);
      setEditTokenPrice(meta.tokenPrice || 0);
      setEditTotalTokens(meta.tokenCount || 0);
      setEditTreasuryTokens(meta.treasuryTokens || 0);
      setEditRoyalties(meta.royalties || 0);
      setEditDescText(meta.description || "");
    } else if (asset) {
      setEditName(asset.name || "");
      setEditSector(asset.type || "");
      setEditValuation(Number(asset.valuation) || 0);
      setEditTokenPrice(Number(asset.tokenPrice) || 0);
      setEditTotalTokens(Number(asset.totalTokens) || 0);
      setEditTreasuryTokens(Number(asset.treasuryTokens) || 0);
      setEditRoyalties(Number(asset.royalties) || 0);
      setEditDescText(asset.description || "");
    }
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async () => {
    setIsSavingEdit(true);
    try {
      if (isDraft) {
        if (!meta) return;
        const updated = {
          ...meta,
          name: editName,
          sector: editSector,
          valuation: editValuation,
          tokenPrice: editTokenPrice,
          tokenCount: editTotalTokens,
          treasuryTokens: editTreasuryTokens,
          royalties: editRoyalties,
          description: editDescText,
        } as DraftMeta;
        setMeta(updated);
        localStorage.setItem(META_KEY, JSON.stringify(updated));
        setIsEditModalOpen(false);
      } else {
        if (!asset || !publicKey) return;
        const res = await fetch(`/api/assets/${asset.id}?wallet=${publicKey.toBase58()}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: editName,
            description: editDescText,
            type: editSector,
            valuation: editValuation,
            tokenPrice: editTokenPrice,
            totalTokens: editTotalTokens,
            treasuryTokens: editTreasuryTokens,
            royalties: editRoyalties,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setAsset((p) => p ? {
          ...p,
          name: editName,
          description: editDescText,
          type: editSector,
          valuation: String(editValuation),
          tokenPrice: String(editTokenPrice),
          totalTokens: editTotalTokens,
          treasuryTokens: editTreasuryTokens,
          royalties: editRoyalties,
        } : p);
        setIsEditModalOpen(false);
      }
    } catch (err: unknown) {
      alert(`Erro ao salvar: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsSavingEdit(false);
    }
  };

  // ─── Motor de Cunhagem ──────────────────────────────────────────────────────
  const [mintingPhase, setMintingPhase] = useState<MintingPhase>("idle");
  const [mintError, setMintError]       = useState<string | null>(null);
  const [extraPdfFile, setExtraPdfFile] = useState<File | null>(null);
  const [savedPaymentTx, setSavedPaymentTx] = useState<string | null>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  // ─── Carregamento ───────────────────────────────────────────────────────────
  const imageUrlRef = useRef<string | null>(null);

  const fetchAsset = async (p: number) => {
    try {
      const res = await fetch(`/api/assets/${id}?page=${p}&limit=10`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao carregar ativo.");
      setAsset(data.asset);
      if (data.financials) {
        setFinancials(data.financials);
      }

      const arweaveUrl = buildArweaveUrl(data.asset.contractUrl);
      if (arweaveUrl) {
        try {
          const jRes = await fetch(arweaveUrl);
          if (jRes.ok) setArweaveData(await jRes.json());
        } catch { /* silencioso */ }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const tx = localStorage.getItem(PAYMENT_TX_KEY);
    if (tx) setSavedPaymentTx(tx);

    if (isDraft) {
      (async () => {
        const savedMeta = loadDraftMeta();
        if (!savedMeta) {
          setError("Rascunho não encontrado. Complete o Wizard de Tokenização primeiro.");
          setIsLoading(false);
          return;
        }
        setMeta(savedMeta);

        const imgBlob = await loadDraftImageBlob();
        if (imgBlob) {
          const url = URL.createObjectURL(imgBlob);
          imageUrlRef.current = url;
          setImageObjectUrl(url);
        }

        const pdfBlob = await loadDraftPdfBlob();
        if (pdfBlob) setPdfBlobForMint(pdfBlob);

        setIsLoading(false);
      })();
    } else {
      fetchAsset(page);
    }

    return () => {
      if (imageUrlRef.current) URL.revokeObjectURL(imageUrlRef.current);
    };
  }, [id, isDraft, page]);

  // Sincroniza acesso à carteira do dono
  useEffect(() => {
    if (!isLoading && asset) {
      if (!solanaWallet.connected || solanaWallet.publicKey?.toBase58() !== asset.ownerWallet) {
        router.push("/marketplace");
      }
    }
  }, [solanaWallet.connected, solanaWallet.publicKey, asset, isLoading, router]);

  // ─── MOTOR DE CUNHAGEM ──────────────────────────────────────────────────────
  const handleMint = useCallback(async () => {
    if (!publicKey) {
      toast.error("Conecte sua wallet para continuar");
      return;
    }
    if (!meta || !walletAddress) return;
    setMintError(null);
    setMintingPhase("idle");

    try {
      // ── PASSO 1/2: TAXA DE TESOURARIA ($0.50) ─────────────────────────────
      let paymentSignature = savedPaymentTx;

      if (!paymentSignature) {
        setMintingPhase("paying");

        let currentPrice = solPrice;
        if (!currentPrice || currentPrice <= 0) currentPrice = await refreshSolPrice();
        if (!currentPrice || currentPrice <= 0) throw new Error("Falha ao obter cotação do SOL. Tente novamente.");

        const solAmount = (TREASURY_FEE_USD / currentPrice) * 1.01; // +1% slippage
        const lamports  = Math.floor(solAmount * LAMPORTS_PER_SOL);

        const userPubKey     = new PublicKey(publicKey.toBase58());
        const treasuryPubKey = new PublicKey(
          process.env.NEXT_PUBLIC_TREASURY_WALLET_ADDRESS || "CXqfj7vFFrpBMVaj8fuyQkGwFgHktdyYVDju723hnmWa"
        );

        const transaction = new Transaction().add(
          SystemProgram.transfer({ fromPubkey: userPubKey, toPubkey: treasuryPubKey, lamports })
        );
        const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("confirmed");
        transaction.recentBlockhash = blockhash;
        transaction.feePayer        = userPubKey;

        paymentSignature = await solanaWallet.sendTransaction(transaction, connection);
        await connection.confirmTransaction(
          { signature: paymentSignature, blockhash, lastValidBlockHeight },
          "confirmed"
        );

        localStorage.setItem(PAYMENT_TX_KEY, paymentSignature);
        setSavedPaymentTx(paymentSignature);
        addTransactionRecord({
          id: Date.now().toString(), type: "USO",
          amount: `$${TREASURY_FEE_USD.toFixed(2)}`, hash: paymentSignature,
          date: new Date().toLocaleString("pt-BR"), planId: "Taxa de Emissão (Tesouraria)",
          solAmount,
        });
      }

      setMintingPhase("paid");

      // ── PASSO 2/2: UPLOAD VIA IRYS WEB SDK ────────────────────────────────
      const irysProvider = solanaWallet?.wallet?.adapter;
      if (!irysProvider) {
        throw new Error(
          "Provedor da carteira conectada não encontrado. Certifique-se de que a carteira está conectada e ativa."
        );
      }

      // Import dinâmico do Irys
      const { WebUploader } = await import("@irys/web-upload");
      const { WebSolana }   = await import("@irys/web-upload-solana");
      const { Buffer: BrowserBuffer } = await import("buffer");

      const irys: any = await WebUploader(WebSolana)
        .withProvider(irysProvider)
        .withRpc("https://api.devnet.solana.com")
        .devnet();

      // Top-up no Irys se necessário
      try {
        const uploadCostEstimate = await irys.getPrice(800_000); 
        const balance            = await irys.getLoadedBalance();
        if (balance.lt(uploadCostEstimate)) {
          await irys.fund(uploadCostEstimate.multipliedBy(1.5).integerValue());
        }
      } catch (fundErr: unknown) {
        console.warn("[Irys] Aviso ao verificar saldo:", fundErr);
      }

      // ── Upload A: Imagem
      setMintingPhase("uploading_image");
      const imgBlob = await loadDraftImageBlob();
      if (!imgBlob) throw new Error("Imagem não encontrada no IndexedDB. Refaça o rascunho no Wizard.");

      const imageBuffer = BrowserBuffer.from(await imgBlob.arrayBuffer());
      const imageReceipt = await irys.upload(imageBuffer, {
        tags: [
          { name: "Content-Type",   value: meta.coverImageMimeType || "image/jpeg" },
          { name: "App-Name",       value: "Lake" },
          { name: "File-Type",      value: "cover-image" },
          { name: "Asset-Name",     value: meta.name },
        ],
      });
      const linkA = `${IRYS_GATEWAY}/${imageReceipt.id}`;

      // ── Upload B: PDF (opcional)
      let linkB: string | null = null;
      const pdfSource: Blob | File | null = extraPdfFile ?? pdfBlobForMint;
      if (pdfSource) {
        setMintingPhase("uploading_pdf");
        const pdfBuffer = BrowserBuffer.from(await pdfSource.arrayBuffer());
        const pdfReceipt = await irys.upload(pdfBuffer, {
          tags: [
            { name: "Content-Type", value: "application/pdf" },
            { name: "App-Name",     value: "Lake" },
            { name: "File-Type",    value: "contract-pdf" },
            { name: "Asset-Name",   value: meta.name },
          ],
        });
        linkB = `${IRYS_GATEWAY}/${pdfReceipt.id}`;
      }

      // ── JSON Mestre
      setMintingPhase("uploading_json");
      const jsonMasterPayload = {
        name: meta.name, sector: meta.sector, tokenNature: meta.tokenNature,
        description: meta.description, valuation: meta.valuation,
        tokenPrice: meta.tokenPrice, totalTokens: meta.tokenCount,
        treasuryTokens: meta.treasuryTokens,
        marketTokens: Math.max(0, meta.tokenCount - meta.treasuryTokens),
        royalties: meta.royalties, imageUrl: linkA, contractUrl: linkB,
        paymentTxHash: paymentSignature, platform: "Lake",
        schemaVersion: "1.0.0", createdAt: new Date().toISOString(),
      };
      const jsonStr = JSON.stringify(jsonMasterPayload, null, 2);
      const jsonReceipt = await irys.upload(jsonStr, {
        tags: [
          { name: "Content-Type", value: "application/json" },
          { name: "App-Name",     value: "Lake" },
          { name: "File-Type",    value: "json-master" },
        ],
      });

      // ── POST /api/assets ───────────────────────────────────────────────────
      setMintingPhase("saving");
      console.log("Wallet Status:", { connected, publicKey: publicKey?.toBase58() });
      const res = await fetch("/api/assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ownerWallet: publicKey.toBase58(), name: meta.name,
          description: meta.description, type: meta.sector, sector: meta.sector,
          tokenNature: meta.tokenNature, valuation: meta.valuation,
          tokenPrice: meta.tokenPrice, totalTokens: meta.tokenCount,
          treasuryTokens: meta.treasuryTokens,
          marketTokens: Math.max(0, meta.tokenCount - meta.treasuryTokens),
          royalties: meta.royalties, imageUrl: imageReceipt.id, contractUrl: jsonReceipt.id,
        }),
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "Erro ao salvar no banco de dados.");

      const createdAssetId = resData.asset.id;

      // Executa PATCH pós-sucesso robusto para confirmar a hash exata no contractUrl
      const patchRes = await fetch(`/api/assets/${createdAssetId}?wallet=${publicKey.toBase58()}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "APPROVED",
          isListed: true,
          contractUrl: jsonReceipt.id,
          imageUrl: imageReceipt.id
        })
      });
      const patchData = await patchRes.json();
      if (!patchRes.ok) {
        console.warn("[PATCH Warning] Falha na confirmação robusta do status:", patchData.error);
      }

      await awardMedal("asset_tokenized");
      setMintingPhase("success");

      await clearDraft();
      setTimeout(() => router.push(`/dashboard/manage/${createdAssetId}`), 2000);

    } catch (err: unknown) {
      const raw = err instanceof Error ? err.message : String(err);
      const friendly = raw.includes("User rejected")
        ? "Transação recusada na carteira. Clique em 'Tentar Novamente' para recomeçar."
        : raw.includes("insufficient funds")
        ? "Saldo de SOL insuficiente para pagar a taxa de emissão e o upload."
        : raw;
      setMintError(friendly);
      setMintingPhase("error");
    }
  }, [meta, walletAddress, savedPaymentTx, solPrice, refreshSolPrice,
      connection, solanaWallet, addTransactionRecord, awardMedal,
      extraPdfFile, pdfBlobForMint, router, publicKey, connected]);

  // ─── Ações Live ─────────────────────────────────────────────────────────────
  const handleToggleList = async () => {
    if (!asset || !solanaWallet.publicKey) return;
    setIsTogglingList(true);
    try {
      const newStatus = !asset.isListed;
      const res = await fetch(`/api/assets/${asset.id}?wallet=${solanaWallet.publicKey.toBase58()}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isListed: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setAsset((p) => p ? { ...p, isListed: newStatus } : p);
    } catch (err: unknown) {
      alert(`Erro: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsTogglingList(false);
    }
  };

  const handleSaveDesc = async () => {
    if (isDraft) {
      if (!meta) return;
      setIsSavingDesc(true);
      try {
        const updated = { ...meta, description: editDescription } as DraftMeta;
        setMeta(updated);
        localStorage.setItem(META_KEY, JSON.stringify(updated));
        setIsEditingDesc(false);
      } catch (err: unknown) {
        alert(`Erro: ${err instanceof Error ? err.message : String(err)}`);
      } finally {
        setIsSavingDesc(false);
      }
      return;
    }

    if (!asset || !solanaWallet.publicKey) return;
    setIsSavingDesc(true);
    try {
      const res = await fetch(`/api/assets/${asset.id}?wallet=${solanaWallet.publicKey.toBase58()}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: editDescription }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setAsset((p) => p ? { ...p, description: editDescription } : p);
      setIsEditingDesc(false);
    } catch (err: unknown) {
      alert(`Erro: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsSavingDesc(false);
    }
  };

  const handleSimulateDividends = () => {
    if (!asset) return;
    setIsSimulating(true);
    setTimeout(() => {
      const val  = safeNum(asset.valuation);
      const rate = Number(dividendPct) / 100;
      setSimulatedPayout((val * rate) / safeNum(asset.totalTokens, 1));
      setIsSimulating(false);
    }, 1200);
  };

  // ─── Loading / Error ─────────────────────────────────────────────────────
  if (isLoading) return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center py-24">
      <Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-4" />
      <span className="text-slate-600 font-medium">Carregando painel...</span>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-md mx-auto bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-sm">
        <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-red-600 mb-3">Acesso Negado</h2>
        <p className="text-slate-500 mb-6">{error}</p>
        <Link href="/tokenize"
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition-colors text-sm">
          Ir para o Wizard de Tokenização
        </Link>
      </div>
    </div>
  );

  // ══════════════════════════════════════════════════════════════════════════════
  // MODO DRAFT — Layout premium unificado (12 colunas, Imagem esquerda, etc.)
  // ══════════════════════════════════════════════════════════════════════════════
  const isMinting = !["idle", "error"].includes(mintingPhase);
  const mintDone  = mintingPhase === "success";
  const hasPdf    = !!(extraPdfFile ?? pdfBlobForMint);

  const MINT_PHASES: MintingPhase[] = [
    "paying", "paid", "uploading_image", "uploading_pdf", "uploading_json", "saving", "success",
  ];
  const currentPhaseIdx = MINT_PHASES.indexOf(mintingPhase);

  const d = {
    name:           isDraft ? safeStr(meta?.name, "Ativo sem nome") : safeStr(arweaveData?.name ?? asset?.name),
    sector:         isDraft ? safeStr(meta?.sector) : safeStr(arweaveData?.sector ?? asset?.type),
    tokenNature:    isDraft ? safeStr(meta?.tokenNature) : safeStr(arweaveData?.tokenNature ?? asset?.tokenNature ?? asset?.type),
    description:    isDraft ? safeStr(meta?.description) : safeStr(arweaveData?.description ?? asset?.description),
    valuation:      isDraft ? safeNum(meta?.valuation) : safeNum(arweaveData?.valuation ?? asset?.valuation),
    tokenPrice:     isDraft ? safeNum(meta?.tokenPrice) : safeNum(arweaveData?.tokenPrice ?? asset?.tokenPrice),
    totalTokens:    isDraft ? safeNum(meta?.tokenCount) : safeNum(arweaveData?.totalTokens ?? asset?.totalTokens),
    treasuryTokens: isDraft ? safeNum(meta?.treasuryTokens) : safeNum(arweaveData?.treasuryTokens ?? asset?.treasuryTokens),
    royalties:      isDraft ? safeNum(meta?.royalties) : safeNum(arweaveData?.royalties ?? asset?.royalties),
    imageUrl: isDraft ? imageObjectUrl : (() => {
      const raw = arweaveData?.imageUrl ?? asset?.imageUrl;
      if (!raw) return null;
      return raw.startsWith("http") ? raw : `${IRYS_GATEWAY}/${raw}`;
    })(),
    jsonMasterUrl:  isDraft ? null : buildArweaveUrl(asset?.contractUrl),
    pdfUrl: isDraft ? null : (() => {
      const raw = arweaveData?.pdf ?? arweaveData?.contractUrl;
      if (!raw) return null;
      return raw.startsWith("http") ? raw : `${IRYS_GATEWAY}/${raw}`;
    })(),
    paymentTxHash:  isDraft ? "" : safeStr(arweaveData?.paymentTxHash, ""),
    createdAt:      isDraft ? meta?.savedAt ?? null : asset?.createdAt ?? null,
    ownerWallet:    isDraft ? (walletAddress || "") : safeStr(asset?.ownerWallet),
    isListed:       isDraft ? true : asset?.isListed,
    id:             isDraft ? "draft" : (asset?.id ?? id),
  };

  const mockFinancials: FinancialsData = {
    tokensSold: 0,
    revenueRaised: 0,
    royaltiesGenerated: 0,
    ledger: [],
    pagination: {
      page: 1,
      totalPages: 1,
      total: 0,
      limit: 10,
    }
  };
  const activeFinancials = isDraft ? mockFinancials : financials;

  const normalizedType = d.sector.toUpperCase();
  const isFinancial = ["IMÓVEL","REAL ESTATE","ENERGIA","ENERGY","AGRO","DÍVIDA","DEBT","PRECATÓRIO",
    "STARTUP","EQUITY","CARBONO","CARBON","FINANCEIRO","FINANCIAL"].some((k) => normalizedType.includes(k));
  const isUtility = !isFinancial;

  return (
    <div className="min-h-screen bg-[#f0ede6] dark:bg-zinc-950 text-slate-900 dark:text-zinc-50 flex flex-col pb-20">
      <div className="w-full max-w-6xl mx-auto px-4 py-10 flex-grow">

        {/* NAVEGAÇÃO */}
        <div className="mb-8">
          <Link href="/marketplace" className="inline-flex items-center gap-2 text-slate-600 hover:text-blue-600 font-medium transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar ao Marketplace</span>
          </Link>
        </div>

        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            {isDraft ? (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 text-xs font-bold mb-3 border border-amber-100 dark:border-amber-900/50">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
                </span>
                Rascunho — Sincronização Pendente
              </div>
            ) : (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 text-xs font-bold mb-3 border border-emerald-100 dark:border-emerald-900/50">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                Painel de Controle RWA Ativo
              </div>
            )}
            <div className="flex items-center gap-3">
              <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-zinc-50">{d.name}</h1>
              {(isDraft || asset?.status === "DRAFT") && (
                <button onClick={handleOpenEditModal}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-violet-700 bg-white border border-violet-200 rounded-lg hover:bg-violet-50 transition shadow-sm dark:bg-zinc-900 dark:text-violet-400 dark:border-violet-800">
                  <Settings className="w-3.5 h-3.5" /> Editar Ativo
                </button>
              )}
            </div>
            <p className="text-slate-500 mt-2 font-medium">
              ID de Registro RWA:{" "}
              <span className="font-mono text-xs bg-slate-200/60 dark:bg-zinc-800 px-2 py-0.5 rounded border border-slate-300 dark:border-zinc-700 text-slate-600 dark:text-zinc-400">
                {d.id}
              </span>
            </p>
          </div>
          <div className="flex items-center gap-3 bg-white dark:bg-zinc-900 px-5 py-3 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-sm">
            <span className="w-3 h-3 rounded-full bg-purple-500 animate-pulse" />
            <div>
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">BLOCKCHAIN ATIVA</div>
              <div className="text-sm font-extrabold text-slate-700 dark:text-zinc-300">Solana Devnet</div>
            </div>
          </div>
        </div>

        {/* CHASSI PREMIUM 12 COLUNAS */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* COLUNA ESQUERDA: IMAGEM & FICHA TÉCNICA */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* IMAGEM */}
            {d.imageUrl && (
              <div className="w-full">
                <div className="w-full h-72 rounded-3xl overflow-hidden border border-[#dbd7c9] dark:border-zinc-800 shadow-sm relative bg-[#f5f3ef] dark:bg-zinc-900 flex items-center justify-center">
                  {!isDraft ? (
                    <a href={(() => {
                      const rawImgHash = arweaveData?.image || arweaveData?.imageUrl || asset?.imageUrl;
                      if (!rawImgHash) return "#";
                      return rawImgHash.startsWith("http") ? rawImgHash : `https://gateway.irys.xyz/${rawImgHash}`;
                    })()} target="_blank" rel="noopener noreferrer" className="w-full h-full block">
                      <img
                        src={d.imageUrl}
                        alt={d.name}
                        className="w-full h-full object-contain p-6 hover:scale-[1.02] transition-transform duration-500"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                      />
                    </a>
                  ) : (
                    <img
                      src={d.imageUrl}
                      alt={d.name}
                      className="w-full h-full object-contain p-6 hover:scale-[1.02] transition-transform duration-500"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                    />
                  )}
                  {isDraft ? (
                    <div className="absolute top-4 left-4 px-3 py-1.5 rounded-xl bg-slate-900/80 backdrop-blur-sm text-white text-xs font-bold flex items-center gap-1.5 border border-white/10 shadow z-10">
                      <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                      Pré-visualização (Local)
                    </div>
                  ) : (
                    <div className="absolute top-4 left-4 px-3 py-1.5 rounded-xl bg-[#0e0d0b] dark:bg-[#ede9df] text-white dark:text-[#0e0d0b] text-xs font-bold flex items-center gap-1.5 border border-white/10 dark:border-black/10 shadow z-10">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 dark:text-emerald-600" />
                      Imagem salva no Arweave via Irys
                    </div>
                  )}
                </div>
                {!isDraft && (
                  <div className="mt-3 flex justify-end gap-3 flex-wrap">
                    {d.jsonMasterUrl && (
                      <a href={d.jsonMasterUrl} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#f5f3ef] dark:bg-[#1c1b18] border border-[#dbd7c9] dark:border-[#2e2c26] hover:border-emerald-400 dark:hover:border-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 text-slate-700 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-400 font-semibold text-xs md:text-sm transition-all shadow-sm">
                        <ShieldCheck className="w-4 h-4 text-emerald-500" />
                        Auditar Contrato Mestre JSON <ExternalLink className="w-3.5 h-3.5 opacity-60" />
                      </a>
                    )}
                    {d.pdfUrl && (
                      <a href={d.pdfUrl} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#f5f3ef] dark:bg-[#1c1b18] border border-[#dbd7c9] dark:border-[#2e2c26] hover:border-emerald-400 dark:hover:border-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 text-slate-700 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-400 font-semibold text-xs md:text-sm transition-all shadow-sm">
                        <ShieldCheck className="w-4 h-4 text-emerald-500" />
                        Auditar Documento Original <ExternalLink className="w-3.5 h-3.5 opacity-60" />
                      </a>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* FICHA TÉCNICA */}
            <div className="bg-[#f5f3ef] dark:bg-[#1c1b18] border border-[#dbd7c9] dark:border-[#2e2c26] rounded-2xl p-6 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-zinc-50 mb-6 flex items-center gap-2 border-b border-[#dbd7c9]/40 dark:border-zinc-800/40 pb-3">
                  <Briefcase className="w-5 h-5 text-blue-600" />
                  {isDraft ? "Ficha Técnica do Rascunho" : "Ficha Técnica de Tokenização"}
                </h3>
                <div className="space-y-4">
                  {[
                    { label: "Nome do Ativo", value: d.name },
                    { label: "Setor / Categoria", value: d.sector },
                    { label: "Natureza do Token", value: d.tokenNature },
                    { label: "Carteira Emissora", value: d.ownerWallet ? `${d.ownerWallet.slice(0, 6)}...${d.ownerWallet.slice(-6)}` : "—" },
                    { label: "Data de Criação", value: d.createdAt ? new Date(d.createdAt).toLocaleDateString("pt-BR") : "—" },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex justify-between items-center text-sm">
                      <span className="text-slate-400 dark:text-zinc-500 font-medium">{label}</span>
                      <span className="text-slate-800 dark:text-zinc-300 font-bold">{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Descrição editável */}
              <div className="mt-8 pt-6 border-t border-[#dbd7c9]/40 dark:border-zinc-800/40">
                <h4 className="text-sm font-bold text-slate-900 dark:text-zinc-50 mb-3">Descrição e Utilidade</h4>
                {isEditingDesc ? (
                  <div className="space-y-3">
                    <textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)}
                      className="w-full p-3 text-sm text-slate-700 dark:text-zinc-300 bg-[#ede9df] dark:bg-zinc-950 border border-[#dbd7c9] dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
                      rows={4} placeholder="Descreva a missão e o lastro deste ativo..." />
                    <div className="flex gap-2">
                      <button onClick={handleSaveDesc} disabled={isSavingDesc}
                        className="px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50">
                        {isSavingDesc ? "Salvando..." : "Salvar"}
                      </button>
                      <button onClick={() => setIsEditingDesc(false)} disabled={isSavingDesc}
                        className="px-4 py-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 text-sm font-bold rounded-lg hover:bg-slate-50">
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-slate-600 dark:text-zinc-400 leading-relaxed">{d.description}</p>
                    {(isDraft || asset?.status === "DRAFT") && (
                      <button onClick={() => { setEditDescription(d.description === "—" ? "" : d.description); setIsEditingDesc(true); }}
                        className="text-sm font-bold text-blue-600 hover:text-blue-700 underline underline-offset-2">
                        Editar Descrição
                      </button>
                    )}
                  </div>
                )}
              </div>

              {isDraft && meta?.pdfFileName && (
                <div className="mt-4 flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 rounded-xl px-4 py-2.5">
                  <FileText className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate font-medium">{meta.pdfFileName}</span>
                  {pdfBlobForMint && <CheckCircle className="w-4 h-4 text-emerald-500 ml-auto flex-shrink-0" />}
                </div>
              )}

              <div className="mt-6 pt-6 border-t border-[#dbd7c9]/40 dark:border-zinc-800/40">
                <div className="p-4 bg-blue-50/50 dark:bg-blue-950/10 rounded-xl border border-blue-100 dark:border-blue-950/30 flex items-start gap-3">
                  <ShieldCheck className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                  <div>
                    <h4 className="text-xs font-bold text-blue-900 dark:text-blue-300 uppercase">
                      {isDraft ? "Documentação Carregada" : "Registro Permanente no Arweave"}
                    </h4>
                    <p className="text-xs text-blue-700 dark:text-blue-400 mt-1 leading-relaxed">
                      {isDraft
                        ? "Os arquivos de imagem e documentos contratuais estão armazenados com segurança local no seu dispositivo e serão eternizados imutavelmente após a autorização de conformidade."
                        : "Metadados, imagem e contrato eternizados via Irys SDK com hash imutável verificável publicamente."}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* COLUNA DIREITA: CARDS, CFO & LEDGER */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* LINHA 1 DE MÉTRICAS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-[#f5f3ef] dark:bg-[#1c1b18] border border-[#dbd7c9] dark:border-[#2e2c26] rounded-2xl p-5 shadow-sm flex items-center justify-between">
                <div className="flex flex-col justify-center items-start space-y-1 min-w-0">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">VALUATION TOTAL</div>
                  <CurrencyDisplay variant="transparent" brlValue={d.valuation} />
                  <div className="text-[10px] font-medium text-slate-500">Avaliação do lastro físico</div>
                </div>
                <div className="p-2.5 bg-blue-50 dark:bg-blue-950/20 rounded-xl border border-blue-100 dark:border-blue-900/30 text-blue-600 shrink-0">
                  <DollarSign className="w-5 h-5" />
                </div>
              </div>
              <div className="bg-[#f5f3ef] dark:bg-[#1c1b18] border border-[#dbd7c9] dark:border-[#2e2c26] rounded-2xl p-5 shadow-sm flex items-center justify-between">
                <div className="flex flex-col justify-center items-start space-y-1 min-w-0">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">TOKENS EMITIDOS</div>
                  <div className="text-2xl font-extrabold text-slate-900 dark:text-zinc-50 leading-none">{d.totalTokens.toLocaleString("pt-BR")}</div>
                  <div className="flex items-center gap-2 mt-1">
                    {isDraft ? (
                      <span className="px-1.5 py-0.5 bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 text-[10px] font-bold rounded-full border border-amber-200 dark:border-amber-900/50">
                        Pendente
                      </span>
                    ) : (
                      <>
                        <span className="px-1.5 py-0.5 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold rounded-full border border-emerald-200 dark:border-emerald-900/50 shrink-0">
                          100% Sincronizado
                        </span>
                        {d.isListed !== undefined && (
                          <button onClick={handleToggleList} disabled={isTogglingList}
                            className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border transition-colors disabled:opacity-50 bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900/40 hover:bg-amber-200 shrink-0`}>
                            {isTogglingList ? "..." : (d.isListed !== false ? "PAUSAR VENDAS" : "RETOMAR VENDAS")}
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
                <div className="p-2.5 bg-purple-50 dark:bg-purple-950/20 rounded-xl border border-purple-100 dark:border-purple-900/30 text-purple-600 shrink-0">
                  <Layers className="w-5 h-5" />
                </div>
              </div>
              <div className="bg-[#f5f3ef] dark:bg-[#1c1b18] border border-[#dbd7c9] dark:border-[#2e2c26] rounded-2xl p-5 shadow-sm flex items-center justify-between">
                <div className="flex flex-col justify-center items-start space-y-1 min-w-0">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">PREÇO DO TOKEN</div>
                  <CurrencyDisplay variant="transparent" brlValue={d.tokenPrice} />
                  <div className="text-[10px] font-medium text-slate-500">Custo unitário fracionado</div>
                </div>
                <div className="p-2.5 bg-amber-50 dark:bg-amber-950/20 rounded-xl border border-amber-100 dark:border-amber-900/30 text-amber-600 shrink-0">
                  <Share2 className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* LINHA 2 DE MÉTRICAS EXTRAS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-[#f5f3ef] dark:bg-[#1c1b18] border border-[#dbd7c9] dark:border-[#2e2c26] rounded-2xl p-5 shadow-sm flex items-center justify-between">
                <div className="flex flex-col justify-center items-start space-y-1 min-w-0">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">TOKENS RETIDOS (TESOURARIA)</div>
                  <div className="text-2xl font-extrabold text-slate-900 dark:text-zinc-50 leading-none">{d.treasuryTokens.toLocaleString("pt-BR")}</div>
                  <div className="text-[10px] font-medium text-slate-500">Mercado: {(d.totalTokens - d.treasuryTokens).toLocaleString("pt-BR")}</div>
                </div>
                <div className="p-2.5 bg-cyan-50 dark:bg-cyan-950/20 rounded-xl border border-cyan-100 dark:border-cyan-900/30 text-cyan-600 shrink-0">
                  <Briefcase className="w-5 h-5" />
                </div>
              </div>
              <div className="bg-[#f5f3ef] dark:bg-[#1c1b18] border border-[#dbd7c9] dark:border-[#2e2c26] rounded-2xl p-5 shadow-sm flex items-center justify-between">
                <div className="flex flex-col justify-center items-start space-y-1 min-w-0">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">ROYALTIES DO CRIADOR</div>
                  <div className="text-2xl font-extrabold text-slate-900 dark:text-zinc-50 leading-none">{d.royalties}%</div>
                  <div className="text-[10px] font-medium text-slate-500">Taxa cobrada no mercado secundário</div>
                </div>
                <div className="p-2.5 bg-rose-50 dark:bg-rose-950/20 rounded-xl border border-rose-100 dark:border-rose-900/30 text-rose-600 shrink-0">
                  <Share2 className="w-5 h-5" />
                </div>
              </div>
              <div className="bg-[#f5f3ef] dark:bg-[#1c1b18] border border-[#dbd7c9] dark:border-[#2e2c26] rounded-2xl p-5 shadow-sm flex items-center justify-between">
                <div className="flex flex-col justify-center items-start space-y-1 min-w-0">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">TOKENS DISPONÍVEIS</div>
                  <div className="text-2xl font-extrabold text-slate-900 dark:text-zinc-50 leading-none">
                    {(!isDraft && asset?.tokensAvailable !== undefined) ? asset.tokensAvailable.toLocaleString("pt-BR") : (d.totalTokens - d.treasuryTokens).toLocaleString("pt-BR")}
                  </div>
                  <div className="text-[10px] font-medium text-slate-500">Saldo liberado para investidores</div>
                </div>
                <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/20 rounded-xl border border-emerald-100 dark:border-emerald-900/30 text-emerald-600 shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* PERFORMANCE E LIQUIDAÇÃO (TERMINAL CFO) */}
            {activeFinancials && (
              <div className="space-y-4">
                <h2 className="text-lg font-bold text-slate-800 dark:text-zinc-200 flex items-center gap-2">
                  <BarChart2 className="w-5 h-5 text-[#6366f1]" />
                  Performance e Sincronização
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-[#f5f3ef] dark:bg-[#1c1b18] border border-[#dbd7c9] dark:border-[#2e2c26] rounded-2xl p-5 shadow-sm">
                    <p className="text-[10px] font-extrabold text-indigo-500 dark:text-indigo-400 uppercase tracking-widest mb-2">TOKENS VENDIDOS</p>
                    <p className="text-3xl font-extrabold text-indigo-900 dark:text-indigo-400">{activeFinancials.tokensSold.toLocaleString("pt-BR")}</p>
                    <p className="text-xs text-indigo-500/70 dark:text-indigo-400/50 font-medium mt-1">Liquidação primária concluída</p>
                  </div>
                  <div className="bg-[#f5f3ef] dark:bg-[#1c1b18] border border-[#dbd7c9] dark:border-[#2e2c26] rounded-2xl p-5 shadow-sm">
                    <p className="text-[10px] font-extrabold text-emerald-500 dark:text-emerald-400 uppercase tracking-widest mb-2">CAPITAL CAPTADO</p>
                    <p className="text-3xl font-extrabold text-emerald-900 dark:text-emerald-400">{activeFinancials.revenueRaised.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 4 })} SOL</p>
                    <p className="text-xs text-emerald-500/70 dark:text-emerald-400/50 font-medium mt-1">Receita bruta arrecadada</p>
                  </div>
                  <div className="bg-[#f5f3ef] dark:bg-[#1c1b18] border border-[#dbd7c9] dark:border-[#2e2c26] rounded-2xl p-5 shadow-sm">
                    <p className="text-[10px] font-extrabold text-purple-500 dark:text-purple-400 uppercase tracking-widest mb-2">ROYALTIES GERADOS</p>
                    <p className="text-3xl font-extrabold text-purple-900 dark:text-purple-400">{activeFinancials.royaltiesGenerated.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 4 })} SOL</p>
                    <p className="text-xs text-purple-500/70 dark:text-purple-400/50 font-medium mt-1">Taxas do mercado secundário</p>
                  </div>
                </div>
              </div>
            )}

            {/* LIVRO-RAZÃO E LIQUIDAÇÕES */}
            {activeFinancials && (
              <div className="bg-[#f5f3ef] dark:bg-[#1c1b18] border border-[#dbd7c9] dark:border-[#2e2c26] rounded-2xl shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-[#dbd7c9]/40 dark:border-zinc-800 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-slate-400" />
                  <h3 className="text-xs font-extrabold text-slate-500 uppercase tracking-widest">LIVRO-RAZÃO E LIQUIDAÇÕES (ON-CHAIN AUDIT)</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-[#ede9df] dark:bg-zinc-900 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest border-b border-[#dbd7c9]/40 dark:border-zinc-800">
                      <tr>
                        <th className="px-6 py-3">Data</th>
                        <th className="px-6 py-3">Hash da Transação</th>
                        <th className="px-6 py-3 text-right">Qtd. Tokens</th>
                        <th className="px-6 py-3 text-right">Valor (SOL)</th>
                        <th className="px-6 py-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#dbd7c9]/20 dark:divide-zinc-800/30">
                      {activeFinancials.ledger.length === 0 ? (
                        <tr><td colSpan={5} className="px-6 py-10 text-center text-slate-400 text-sm">Nenhuma liquidação registrada ainda.</td></tr>
                      ) : activeFinancials.ledger.map((e, i) => (
                        <tr key={e.id || i} className="hover:bg-slate-50/20 transition-colors">
                          <td className="px-6 py-4 text-slate-600 dark:text-zinc-400 font-medium whitespace-nowrap">
                            {new Date(e.date).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {e.hash ? (
                              <a href={`https://solscan.io/tx/${e.hash}?cluster=devnet`} target="_blank" rel="noopener noreferrer"
                                className="text-blue-500 hover:text-blue-700 dark:text-blue-400 font-mono text-xs flex items-center gap-1">
                                {e.hash.slice(0, 6)}...{e.hash.slice(-6)} <ExternalLink className="w-3 h-3" />
                              </a>
                            ) : <span className="text-slate-400 text-xs italic">Pendente</span>}
                          </td>
                          <td className="px-6 py-4 text-right font-bold text-slate-800 dark:text-zinc-300">{e.quantity.toLocaleString()}</td>
                          <td className="px-6 py-4 text-right font-bold text-emerald-600 dark:text-emerald-400">{e.value.toLocaleString("en-US", { minimumFractionDigits: 4, maximumFractionDigits: 4 })}</td>
                          <td className="px-6 py-4 text-center">
                            <span className="px-2 py-1 rounded text-[10px] font-bold uppercase bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400">{e.status}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {!isDraft && activeFinancials.pagination && activeFinancials.pagination.totalPages > 1 && (
                  <div className="px-6 py-3 border-t border-[#dbd7c9]/40 dark:border-zinc-800 bg-[#ede9df]/50 dark:bg-zinc-900/50 flex items-center justify-between">
                    <button disabled={page <= 1} onClick={() => setPage(page - 1)}
                      className="px-3 py-1.5 text-xs font-bold bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 disabled:opacity-40 transition-colors">
                      ← Anterior
                    </button>
                    <span className="text-xs font-medium text-slate-500">Página {activeFinancials.pagination.page} de {activeFinancials.pagination.totalPages}</span>
                    <button disabled={page >= activeFinancials.pagination.totalPages} onClick={() => setPage(page + 1)}
                      className="px-3 py-1.5 text-xs font-bold bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 disabled:opacity-40 transition-colors">
                      Próxima →
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* CONTROLES / SIMULAÇÃO */}
            {isDraft ? (
              /* DRAFT EMISSION PANEL */
              <div className="bg-[#f5f3ef] dark:bg-[#1c1b18] border border-[#dbd7c9] dark:border-[#2e2c26] rounded-2xl p-6 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900 dark:text-zinc-50 mb-1 flex items-center gap-2 border-b border-[#dbd7c9]/40 dark:border-zinc-800/40 pb-3">
                  <ShieldCheck className="w-5 h-5 text-indigo-600" />
                  Autorizar Registro e Emissão do Ativo
                </h3>
                <p className="text-sm text-slate-500 dark:text-zinc-400 mt-3 mb-6 leading-relaxed">
                  Estrutura sob conformidade pré-aprovada. Revise a ficha técnica ao lado e confirme a autorização regulatória.
                  O processo requer <strong>duas confirmações seguras</strong>: a taxa de processamento de custódia ($0.50) e a sincronização do livro-razão público.
                </p>

                {/* PDF extra */}
                {!pdfBlobForMint && (
                  <div className="mb-5">
                    <p className="text-xs font-bold text-slate-500 dark:text-zinc-450 uppercase tracking-widest mb-2">
                      Contrato PDF (Opcional)
                    </p>
                    {extraPdfFile ? (
                      <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-xl border border-blue-100 dark:border-blue-900/40">
                        <FileText className="w-5 h-5 text-blue-500 flex-shrink-0" />
                        <span className="text-sm font-medium text-slate-700 dark:text-zinc-300 flex-1 truncate">{extraPdfFile.name}</span>
                        <button onClick={() => setExtraPdfFile(null)} className="p-1 hover:text-red-500 text-slate-400 transition-colors">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => pdfInputRef.current?.click()}
                        className="w-full py-3 border-2 border-dashed border-[#dbd7c9] dark:border-zinc-800 rounded-xl text-sm font-medium text-slate-500 dark:text-zinc-450 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/10 transition-all flex items-center justify-center gap-2">
                        <Upload className="w-4 h-4" /> Anexar PDF (opcional)
                      </button>
                    )}
                    <input ref={pdfInputRef} type="file" accept="application/pdf" className="hidden"
                      onChange={(e) => e.target.files && setExtraPdfFile(e.target.files[0])} />
                  </div>
                )}

                {/* Retry banner */}
                {savedPaymentTx && mintingPhase === "idle" && (
                  <div className="mb-5 p-3 bg-green-50 dark:bg-green-950/20 rounded-xl border border-green-100 dark:border-green-900/40 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <p className="text-xs text-green-700 dark:text-green-400 font-medium">
                      Custódia e taxa regulatória já processadas — ao clicar em &quot;Retomar Registro&quot;, a sincronização continuará de onde parou.
                    </p>
                  </div>
                )}

                {/* Erro de cunhagem */}
                {mintError && mintingPhase === "error" && (
                  <div className="mb-5 p-4 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/40 rounded-xl flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-red-700 dark:text-red-400 mb-1">Falha no Registro Regulatório</p>
                      <p className="text-xs text-red-600 dark:text-red-450 break-words font-mono leading-relaxed">{mintError}</p>
                    </div>
                  </div>
                )}

                {/* Progress inline */}
                {isMinting && (
                  <div className="mb-5 p-4 bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 rounded-xl">
                    <div className="flex items-center gap-3 mb-3">
                      {mintDone
                        ? <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                        : <Loader2 className="w-5 h-5 text-indigo-500 animate-spin flex-shrink-0" />}
                      <p className="text-sm font-bold text-indigo-800 dark:text-indigo-300">{getMintLabel(mintingPhase, hasPdf)}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      {MINT_PHASES.map((p, i) => (
                        <div key={p}
                          className={`h-1.5 rounded-full flex-1 transition-all duration-500 ${i <= currentPhaseIdx ? "bg-indigo-500" : "bg-slate-200 dark:bg-zinc-800"}`}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Botão principal */}
                <button
                  onClick={handleMint}
                  disabled={isMinting}
                  className={`w-full py-4 rounded-xl font-bold text-white text-lg flex items-center justify-center gap-3 transition-all shadow-md
                    ${mintDone
                      ? "bg-emerald-600 shadow-emerald-200"
                      : mintingPhase === "error"
                      ? "bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 shadow-red-200"
                      : "bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 shadow-indigo-200 disabled:opacity-60 disabled:cursor-not-allowed"
                    }`}
                >
                  {mintDone ? (
                    <><CheckCircle2 className="w-6 h-6" /> Registro Concluído! Redirecionando...</>
                  ) : isMinting ? (
                    <><Loader2 className="w-6 h-6 animate-spin" /> Efetuando Registro Digital Imutável...</>
                  ) : mintingPhase === "error" ? (
                    <><RefreshCw className="w-6 h-6" /> {savedPaymentTx ? "Retomar Registro" : "Tentar Novamente"}</>
                  ) : (
                    <><Zap className="w-6 h-6 fill-white" /> Autorizar Registro e Publicação do Ativo</>
                  )}
                </button>

                {mintingPhase === "idle" && !savedPaymentTx && (
                  <p className="text-center text-xs text-slate-400 mt-3">
                    Taxa regulatória de plataforma: <strong className="text-slate-600 dark:text-zinc-400">$0.50 USD (em SOL)</strong> · Sincronização e auditoria perpétua via Arweave
                  </p>
                )}
              </div>
            ) : !isUtility ? (
              /* LIVE FINANCIAL: SIMULADOR DE DIVIDENDOS */
              <div className="bg-[#f5f3ef] dark:bg-[#1c1b18] border border-[#dbd7c9] dark:border-[#2e2c26] rounded-2xl p-6 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900 dark:text-zinc-50 mb-6 flex items-center gap-2 border-b border-[#dbd7c9]/40 dark:border-zinc-800/40 pb-3">
                  <Sliders className="w-5 h-5 text-purple-600" />
                  Simulador de Dividendos
                </h3>
                <p className="text-sm text-slate-500 dark:text-zinc-400 mb-6 leading-relaxed">
                  Simule a distribuição de rendimentos com base na taxa de retorno anual desejada.
                </p>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-sm font-semibold text-slate-700 dark:text-zinc-300">Taxa de Retorno Anual</label>
                      <span className="text-sm font-extrabold text-purple-600 bg-purple-50 dark:bg-purple-950/20 px-2 py-0.5 rounded border border-purple-100 dark:border-purple-900/30">
                        {dividendPct}% a.a.
                      </span>
                    </div>
                    <input type="range" min="1" max="30" step="0.5" value={dividendPct}
                      onChange={(e) => { setDividendPct(e.target.value); setSimulatedPayout(null); }}
                      className="w-full accent-purple-600" />
                  </div>
                  <button onClick={handleSimulateDividends} disabled={isSimulating}
                    className="w-full py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                    {isSimulating ? <><Loader2 className="w-5 h-5 animate-spin" /> Calculando...</> : <><Play className="w-4 h-4" /> Simular Dividendos</>}
                  </button>
                  {simulatedPayout !== null && (
                    <div className="p-5 bg-purple-50 dark:bg-purple-950/20 rounded-2xl border border-purple-100 dark:border-purple-900/40 text-center animate-in zoom-in-95 duration-150">
                      <div className="text-xs font-bold text-purple-400 dark:text-purple-300 uppercase tracking-wider mb-1">Rendimento por Token</div>
                      <div className="text-3xl font-extrabold text-purple-700 dark:text-purple-400">
                        {simulatedPayout.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 4 })}
                      </div>
                      <p className="text-[10px] text-purple-500 dark:text-purple-455 font-semibold mt-1">
                        {dividendPct}% de R${d.valuation.toLocaleString("pt-BR")} ÷ {d.totalTokens.toLocaleString("pt-BR")} tokens
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* LIVE UTILITY: ACCESS CONTROL */
              <div className="bg-[#f5f3ef] dark:bg-[#1c1b18] border border-[#dbd7c9] dark:border-[#2e2c26] rounded-2xl p-6 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900 dark:text-zinc-50 mb-6 flex items-center gap-2 border-b border-[#dbd7c9]/40 dark:border-zinc-800/40 pb-3">
                  <Sliders className="w-5 h-5 text-indigo-600" />
                  Painel de Utilidade (Controle de Acesso)
                </h3>
                <p className="text-sm text-slate-500 dark:text-zinc-400 mb-6 leading-relaxed">
                  Como gestor deste token de utilidade/acesso, gerencie permissões e audite acessos ativos em tempo real.
                </p>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="p-4 bg-indigo-50/50 dark:bg-indigo-950/20 rounded-xl border border-indigo-100 dark:border-indigo-900/30 text-center">
                    <div className="text-xs text-indigo-400 dark:text-indigo-300 font-bold uppercase mb-1">Acessos Ativos</div>
                    <div className="text-2xl font-black text-indigo-700 dark:text-indigo-400">1,482</div>
                  </div>
                  <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-xl border border-emerald-100 dark:border-emerald-900/30 text-center">
                    <div className="text-xs text-emerald-400 dark:text-emerald-300 font-bold uppercase mb-1">Tokens Verificados</div>
                    <div className="text-2xl font-black text-emerald-700 dark:text-emerald-400">99.1%</div>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => alert("Token de acesso validado na blockchain Solana.")}
                    className="flex-1 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-bold rounded-xl shadow-md transition-all text-sm flex items-center justify-center gap-2">
                    Validar Token de Acesso
                  </button>
                  <button onClick={() => confirm("Confirmar revogação permanente deste passe RWA?") && alert("Passe revogado e sincronizado on-chain.")}
                    className="flex-1 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold rounded-xl shadow-md transition-all text-sm flex items-center justify-center gap-2">
                    Revogar Passe
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl shadow-2xl max-w-2xl w-full p-8 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200 text-slate-800 dark:text-zinc-100">
            <h2 className="text-2xl font-bold mb-6 text-slate-900 dark:text-zinc-50">Editar Ativo (Metadados)</h2>
            <div className="space-y-4 text-left">
              <div>
                <label className="text-xs font-bold text-slate-400 dark:text-zinc-550 uppercase tracking-wide">Nome do Ativo</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full mt-1 p-3 border border-[#dbd7c9] dark:border-zinc-800 rounded-xl bg-slate-50 dark:bg-zinc-950 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-400 dark:text-zinc-550 uppercase tracking-wide">Setor</label>
                  <input
                    type="text"
                    value={editSector}
                    onChange={(e) => setEditSector(e.target.value)}
                    className="w-full mt-1 p-3 border border-[#dbd7c9] dark:border-zinc-800 rounded-xl bg-slate-50 dark:bg-zinc-950 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 dark:text-zinc-550 uppercase tracking-wide">Royalties (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={editRoyalties}
                    onChange={(e) => setEditRoyalties(parseFloat(e.target.value) || 0)}
                    className="w-full mt-1 p-3 border border-[#dbd7c9] dark:border-zinc-800 rounded-xl bg-slate-50 dark:bg-zinc-950 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-400 dark:text-zinc-550 uppercase tracking-wide">Valuation (R$)</label>
                  <input
                    type="number"
                    value={editValuation}
                    onChange={(e) => setEditValuation(parseFloat(e.target.value) || 0)}
                    className="w-full mt-1 p-3 border border-[#dbd7c9] dark:border-zinc-800 rounded-xl bg-slate-50 dark:bg-zinc-950 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 dark:text-zinc-550 uppercase tracking-wide">Preço do Token (R$)</label>
                  <input
                    type="number"
                    value={editTokenPrice}
                    onChange={(e) => setEditTokenPrice(parseFloat(e.target.value) || 0)}
                    className="w-full mt-1 p-3 border border-[#dbd7c9] dark:border-zinc-800 rounded-xl bg-slate-50 dark:bg-zinc-950 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-400 dark:text-zinc-550 uppercase tracking-wide">Qtd. Total de Tokens</label>
                  <input
                    type="number"
                    value={editTotalTokens}
                    onChange={(e) => setEditTotalTokens(parseInt(e.target.value) || 0)}
                    className="w-full mt-1 p-3 border border-[#dbd7c9] dark:border-zinc-800 rounded-xl bg-slate-50 dark:bg-zinc-950 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 dark:text-zinc-550 uppercase tracking-wide">Tokens Retidos (Tesouraria)</label>
                  <input
                    type="number"
                    value={editTreasuryTokens}
                    onChange={(e) => setEditTreasuryTokens(parseInt(e.target.value) || 0)}
                    className="w-full mt-1 p-3 border border-[#dbd7c9] dark:border-zinc-800 rounded-xl bg-slate-50 dark:bg-zinc-950 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 dark:text-zinc-550 uppercase tracking-wide">Descrição</label>
                <textarea
                  value={editDescText}
                  onChange={(e) => setEditDescText(e.target.value)}
                  rows={4}
                  className="w-full mt-1 p-3 border border-[#dbd7c9] dark:border-zinc-800 rounded-xl bg-slate-50 dark:bg-zinc-950 focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
                />
              </div>
            </div>
            <div className="mt-8 flex gap-3 justify-end">
              <button
                onClick={() => setIsEditModalOpen(false)}
                disabled={isSavingEdit}
                className="px-5 py-2.5 bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-bold text-sm rounded-xl hover:bg-slate-200 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={isSavingEdit}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl transition-colors disabled:opacity-50"
              >
                {isSavingEdit ? "Salvando..." : "Salvar Alterações"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
