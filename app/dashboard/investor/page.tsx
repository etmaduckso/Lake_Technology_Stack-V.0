"use client";

import { useEffect, useState } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import {
  ShieldCheck,
  Copy,
  ExternalLink,
  Loader2,
  Wallet,
  TrendingUp,
  TrendingDown,
  Store,
  X,
  Trash2,
  User,
  Camera,
  Coins,
  Medal,
  Star,
  BarChart3,
  BookmarkPlus,
  AlertCircle,
  CheckCircle2,
  Clock,
  Lock,
  Pencil,
  Zap,
  ArrowRight,
  Stamp,
} from "lucide-react";
import Link from "next/link";
import { Transaction, SystemProgram, PublicKey, LAMPORTS_PER_SOL, Connection, clusterApiUrl } from "@solana/web3.js";
import { useRouter } from "next/navigation";
import { useCredits } from "@/context/credits-context";
import { useMedals } from "@/context/medals-context";
import { useNetworkHub } from "@/context/NetworkContext";
import { toast } from "sonner";
import { useRequireWallet } from "@/hooks/useRequireWallet";
import { buildAndUploadIdentity } from "@/lib/identity-metadata";
import { useVisitorOnChainData } from "@/hooks/useVisitorOnChainData";
import { CertidaoModal } from "@/components/CertidaoModal";

// ════════════════════════════════════════════════════════════════════════════
// MOCK SERVICE — Interfaces, Utilitários e Dados Sintéticos
// Substitui textos hardcoded enquanto o backend de perfil não está disponível.
// Quando a rota GET /api/users/profile for criada, trocar MOCK_CITIZEN_DATA
// pelo retorno da API. NÃO alterar lógica de negócio abaixo desta seção.
// ════════════════════════════════════════════════════════════════════════════

/** Identidade visual do cidadão Lake (alimentada futuramente pelo UserProfile do banco) */
interface LakeIdentity {
  /** Nome base escolhido pelo usuário (ex: "Zuba", "Alice") */
  baseNickname: string;
  /** URL da imagem SBT/avatar (futuramente Arweave Mainnet; por ora placeholder) */
  avatarUrl: string | null;
  /** Número sequencial de identificação LKZ (ex: #00042) */
  idNumber: number;
  /** true = usuário completou a Trilha Lake inteira (Lake PRO) */
  isPro: boolean;
  /**
   * Tier de acesso do usuário no ecossistema Lake:
   *   'VISITOR'  — Cadastro gratuito via Solana Devnet.
   *                Dados persistidos no banco Lake (PostgreSQL).
   *                Identidade provisória: sem SBT on-chain.
   *   'CITIZEN'  — SBT cunhado na Solana Mainnet (custo: $1 USDC).
   *                Identidade permanente e soberana on-chain.
   *                Desbloqueia funcionalidades exclusivas do ecossistema.
   */
  tier: 'VISITOR' | 'CITIZEN';
}

/** Consolidado financeiro mockado — será derivado de credit_ledger + InvestmentReceipt */
interface MockDashboardData {
  /** P&L total do portfólio em BRL (soma de todas as Marcações a Mercado) */
  totalPortfolioPLBRL: number | null;
  /** Royalties de revenda já acumulados pelo emissor (em BRL) */
  accruedRoyaltiesBRL: number;
  /** Total de créditos já gastos na plataforma (credit_ledger USAGE + *_FEE) */
  totalCreditsSpent: number;
  /** Total de créditos já comprados/recebidos na plataforma */
  totalCreditsDeposited: number;
}

/**
 * Gera o nickname único do cidadão Lake seguindo a regra SBT.
 *
 * Regra de Negócio:
 *   - Com carteira: `{baseName}...{últimos 4 chars da pubkey}`
 *     Ex: baseName="Zuba", wallet termina em "8evN" → "Zuba...8evN"
 *   - Sem carteira: retorna "Conecte sua carteira"
 *
 * @param baseName  Nome base escolhido pelo usuário
 * @param walletPubKey  Endereço Base58 completo da carteira Solana (ou null)
 */
function generateUniqueNickname(
  baseName: string,
  walletPubKey: string | null
): string {
  if (!walletPubKey) return "Conecte sua carteira";
  const suffix = walletPubKey.slice(-4);
  return `${baseName}...${suffix}`;
}

function triggerConfetti() {
  if (typeof window === "undefined") return;
  const canvas = document.createElement("canvas");
  canvas.style.position = "fixed";
  canvas.style.top = "0";
  canvas.style.left = "0";
  canvas.style.width = "100vw";
  canvas.style.height = "100vh";
  canvas.style.pointerEvents = "none";
  canvas.style.zIndex = "9999";
  document.body.appendChild(canvas);

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const colors = ["#22c55e", "#3b82f6", "#a855f7", "#eab308", "#f97316", "#ec4899"];
  const confettiCount = 150;
  const particles: Array<{
    x: number;
    y: number;
    size: number;
    color: string;
    speedX: number;
    speedY: number;
    rotation: number;
    rotationSpeed: number;
  }> = [];

  for (let i = 0; i < confettiCount; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height - canvas.height,
      size: Math.random() * 8 + 5,
      color: colors[Math.floor(Math.random() * colors.length)],
      speedX: Math.random() * 4 - 2,
      speedY: Math.random() * 5 + 4,
      rotation: Math.random() * 360,
      rotationSpeed: Math.random() * 10 - 5,
    });
  }

  const startTime = Date.now();

  function animate() {
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    let active = false;
    particles.forEach((p) => {
      p.y += p.speedY;
      p.x += p.speedX;
      p.rotation += p.rotationSpeed;

      if (p.y < canvas.height) {
        active = true;
      }

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rotation * Math.PI) / 180);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
      ctx.restore();
    });

    if (active && Date.now() - startTime < 4000) {
      requestAnimationFrame(animate);
    } else {
      if (document.body.contains(canvas)) {
        document.body.removeChild(canvas);
      }
    }
  }

  animate();
}

/** Dados sintéticos ricos para hidratação da UI do Lake ID Card */
const MOCK_CITIZEN_DATA: { identity: LakeIdentity; financials: MockDashboardData } = {
  identity: {
    baseNickname: "Cidadão Lake",
    avatarUrl: null,                  // null = exibe ícone genérico; substituir por URL Arweave Mainnet
    idNumber: 42,                     // ex: LKZ-#00042
    isPro: false,                     // true quando fase-pro-institucional for earned
    // ─── DUAL-TIER: altere para 'CITIZEN' para testar o estado de Cidadão Oficial ───
    // 'VISITOR'  → Devnet, gratuito, badge "Visto Provisório" + CTA de upgrade
    // 'CITIZEN'  → Mainnet, SBT cunhado, badge de Cidadão Oficial
    tier: 'VISITOR',
  },
  financials: {
    totalPortfolioPLBRL: null,        // null até oracle estar disponível
    accruedRoyaltiesBRL: 0,           // mockado em 0 — sem tabela de royalties ainda
    totalCreditsSpent: 0,             // será derivado do credit_ledger
    totalCreditsDeposited: 0,         // será derivado do credit_ledger
  },
};

// ─── Tipos de abas (expandido com as 2 novas) ──────────────────────────────
type ActiveTab = "investimentos" | "emissoes" | "secundario" | "watchlist";

// ─── Configuração das abas ─────────────────────────────────────────────────
const TABS: { key: ActiveTab; label: string; icon: React.ReactNode }[] = [
  { key: "investimentos",  label: "Meus Investimentos", icon: <TrendingUp className="w-4 h-4" /> },
  { key: "emissoes",       label: "Minhas Emissões",    icon: <BarChart3 className="w-4 h-4" /> },
  { key: "secundario",     label: "Mercado Secundário", icon: <Store className="w-4 h-4" /> },
  { key: "watchlist",      label: "Favoritos",          icon: <BookmarkPlus className="w-4 h-4" /> },
];

export default function InvestorDashboard() {
  const { publicKey, sendTransaction, wallet } = useWallet();
  const { connection } = useConnection();
  const { currentTier, setTier, isMainnet, userNetworkPreference, toggleNetworkPreference, sbtNickname, sbtAvatarUrl, setSbtIdentity, irysNodeUrl } = useNetworkHub();
  const router = useRouter();

  // ── Integração On-Chain de Visto de Visitante (Fase 1) ─────────────────
  const { metadata: visitorOnChain } = useVisitorOnChainData(
    process.env.NEXT_PUBLIC_VISITOR_PROGRAM_ID || "LKVist7pG9nQwZzYtB7mRqpXYZ11111111111111111"
  );
  const [isCertidaoModalOpen, setIsCertidaoModalOpen] = useState(false);

  // ── Estados originais (preservados integralmente) ────────────────────────
  const [receipts, setReceipts] = useState<any[]>([]);
  const [createdAssets, setCreatedAssets] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<ActiveTab>("investimentos");
  const [isLoading, setIsLoading] = useState(true);
  const [isUpgrading, setIsUpgrading] = useState(false);

  // Oracle States (originais)
  const [solPriceBRL, setSolPriceBRL] = useState<number | null>(null);
  const [solPriceUSD, setSolPriceUSD] = useState<number | null>(null);

  // Modal States (originais)
  const [isListingId, setIsListingId] = useState<string | null>(null);
  const [selectedReceipt, setSelectedReceipt] = useState<any | null>(null);
  const [resaleQty, setResaleQty] = useState<number>(1);
  const [resalePrice, setResalePrice] = useState<number>(0);

  // ── Novos hooks para o painel de métricas ────────────────────────────────
  const { credits, openModal, spendCredit } = useCredits();
  const requireWallet = useRequireWallet();
  const { earned, total: totalMedals } = useMedals();

  // ── Constantes de Tokenomics ($LKZ) ──────────────────────────────────────
  /** Custo em $LKZ para editar o perfil provisório na Rede Simulada */
  const EDIT_LKZ_COST = 10;
  /** Custo em $LKZ para fazer upgrade para Cidadão na Rede Principal */
  const UPGRADE_LKZ_COST = 5;

  // Estados de saldos reais
  const [solBalance, setSolBalance] = useState<number | null>(null);
  const [usdcBalance, setUsdcBalance] = useState<number | null>(null);

  // Estados para o modal de Upgrade (Rede Principal — Cidadão Permanente)
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [upgradeNickname, setUpgradeNickname] = useState("");
  const [upgradeFile, setUpgradeFile] = useState<File | null>(null);
  const [upgradePreview, setUpgradePreview] = useState<string | null>(null);
  const [upgradeStep, setUpgradeStep] = useState<1 | 2 | 3>(1);
  // Flag: indica se os dados do upgrade foram herdados da identidade provisória
  const [upgradeInheritedData, setUpgradeInheritedData] = useState(false);

  // Estados para o modal de Edição Provisória (Rede Simulada)
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);
  const [editNickname, setEditNickname] = useState("");
  const [editFile, setEditFile] = useState<File | null>(null);
  const [editPreview, setEditPreview] = useState<string | null>(null);
  const [editStep, setEditStep] = useState<1 | 2 | 3>(1);
  const [isEditingSaving, setIsEditingSaving] = useState(false);

  // Carrega sbtImageUrl do banco de dados para travas de imutabilidade
  const [sbtImageUrl, setSbtImageUrl] = useState<string | null>(null);

  useEffect(() => {
    const loadProfileSbtUrl = async () => {
      if (!publicKey) {
        setSbtImageUrl(null);
        return;
      }
      try {
        const res = await fetch(`/api/users/profile?wallet=${publicKey.toBase58()}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.sbtImageUrl) {
            setSbtImageUrl(data.sbtImageUrl);
          } else {
            setSbtImageUrl(null);
          }
        }
      } catch (err) {
        console.error("Erro ao carregar sbtImageUrl para imutabilidade:", err);
      }
    };
    loadProfileSbtUrl();
  }, [publicKey]);

  // O perfil agora é hidratado de forma passiva e global pelo WalletProvider no primeiro handshake.

  // Monitoramento de saldos via RPC
  useEffect(() => {
    const fetchBalances = async () => {
      if (!publicKey || !connection) {
        setSolBalance(null);
        setUsdcBalance(null);
        return;
      }
      try {
        // SOL Balance
        const balanceLamports = await connection.getBalance(publicKey);
        setSolBalance(balanceLamports / LAMPORTS_PER_SOL);

        // USDC Balance
        const usdcMintAddress = isMainnet
          ? "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
          : "Gh9ZwEmdLJ8DscKNTbgqAAKbHmQCQ9C57b3beAJtBVqq";

        const response = await connection.getParsedTokenAccountsByOwner(
          publicKey,
          { mint: new PublicKey(usdcMintAddress) }
        );

        if (response.value && response.value.length > 0) {
          const amount = response.value[0].account.data.parsed.info.tokenAmount.uiAmount;
          setUsdcBalance(amount ?? 0);
        } else {
          setUsdcBalance(0);
        }
      } catch (err) {
        console.error("Erro ao carregar saldos reais da carteira:", err);
      }
    };

    fetchBalances();
    const interval = setInterval(fetchBalances, 15000);
    return () => clearInterval(interval);
  }, [publicKey, connection, isMainnet]);

  // ── Oracle (preservado) ──────────────────────────────────────────────────
  useEffect(() => {
    const fetchOracle = async () => {
      try {
        const res = await fetch("https://economia.awesomeapi.com.br/json/last/SOL-BRL,SOL-USD");
        const data = await res.json();
        setSolPriceBRL(parseFloat(data.SOLBRL.ask));
        setSolPriceUSD(parseFloat(data.SOLUSD.ask));
      } catch (err) {
        console.error("Erro no oráculo AwesomeAPI:", err);
      }
    };
    fetchOracle();
  }, []);

  // ── Fetch de dados (preservados) ─────────────────────────────────────────
  const fetchReceipts = async () => {
    if (!publicKey) return;
    try {
      const res = await fetch(`/api/investor/receipts?wallet=${publicKey.toBase58()}`);
      const data = await res.json();
      if (data.receipts) {
        setReceipts(data.receipts);
      }
    } catch (err) {
      console.error("Erro ao buscar recibos:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPrimaryAssets = async () => {
    if (!publicKey) return;
    try {
      const res = await fetch(`/api/assets?wallet=${publicKey.toBase58()}`);
      const data = await res.json();
      if (data.assets) {
        setCreatedAssets(data.assets.filter((a: any) => a.ownerWallet === publicKey.toBase58()));
      }
    } catch (err) {
      console.error("Erro ao buscar ativos:", err);
    }
  };

  useEffect(() => {
    if (publicKey) {
      fetchReceipts();
      fetchPrimaryAssets();
    } else {
      setIsLoading(false);
    }
  }, [publicKey]);

  // ── Handlers originais (preservados) ────────────────────────────────────
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error("Arquivo excede o limite de 10MB.");
        return;
      }
      setUpgradeFile(file);
      setUpgradePreview(URL.createObjectURL(file));
    }
  };

  // ── Handler: Abre modal de edição provisória (Rede Simulada) ──────────────
  const handleEditProfile = () => {
    setEditNickname(sbtNickname || "");
    setEditPreview(sbtAvatarUrl || null);
    setEditFile(null);
    setEditStep(1);
    setIsEditProfileModalOpen(true);
  };

  // Busca o preço do storage no nó Irys correspondente para estimativa on-chain
  const getStorageFee = async (fileSize: number, nodeUrl: string): Promise<number> => {
    try {
      const totalBytes = fileSize + 500; // JSON metadata payload is around 500 bytes
      const cleanNodeUrl = nodeUrl.replace(/\/$/, "");
      const res = await fetch(`${cleanNodeUrl}/price?token=solana&bytes=${totalBytes}`);
      if (!res.ok) throw new Error("Erro ao consultar preço do Irys");
      const priceLamportsStr = await res.text();
      const priceLamports = parseInt(priceLamportsStr, 10);
      if (isNaN(priceLamports)) return 0.0001; 
      return priceLamports / LAMPORTS_PER_SOL;
    } catch (e) {
      console.warn("[Irys Price Fetch] Erro ao buscar preço real do storage, usando fallback:", e);
      return 0.0001; // safe fallback (100k lamports)
    }
  };

  // Busca o endereço Solana de depósito/funding do nó Irys correspondente
  const getIrysFundingAddress = async (nodeUrl: string): Promise<string> => {
    try {
      const cleanNodeUrl = nodeUrl.replace(/\/$/, "");
      const res = await fetch(`${cleanNodeUrl}/info`);
      if (!res.ok) throw new Error("Erro ao consultar info do Irys");
      const info = await res.json();
      const addr = info.addresses?.solana;
      if (!addr) throw new Error("Endereço Solana não encontrado no info");
      return addr;
    } catch (e) {
      console.warn("[Irys Address Fetch] Erro ao buscar endereço real do Irys, usando fallback:", e);
      return nodeUrl.includes("devnet")
        ? "4a7s9iC5NwfUtf8fXpKWxYXcekfqiN6mRqipYXMtcrUS"
        : "5z2wM2R5QQ3qbg2Wtt8zX77BPrRsDaZueb1kLdidzKZE";
    }
  };

  // ── Handler: Salva edição provisória (upload Arweave Devnet via Irys Web SDK) ──
  const handleEditProfileSave = async () => {
    if (!publicKey) {
      toast.error("Conecte sua carteira primeiro.");
      return;
    }
    if (!editNickname.trim()) {
      toast.error("Por favor, informe seu nickname.");
      return;
    }
    setIsEditingSaving(true);
    try {
      // ── PASSO 1: Transação SOL — Split 95/5 em SOL falso (Rede Simulada) + Custo de bytes ──
      let currentPrice = solPriceUSD;
      if (!currentPrice || currentPrice <= 0) {
        // Fallback oráculo AwesomeAPI (idêntico ao Upgrade)
        const priceRes = await fetch("https://economia.awesomeapi.com.br/json/last/SOL-USD");
        const priceData = await priceRes.json();
        currentPrice = parseFloat(priceData.SOLUSD.ask) || 150;
      }

      const totalUSD = 1;
      const totalSol = totalUSD / currentPrice;
      const totalLamports = Math.round(totalSol * LAMPORTS_PER_SOL);
      const platformLamports = Math.round(totalSol * 0.95 * LAMPORTS_PER_SOL);
      const liquidityLamports = totalLamports - platformLamports;

      // Calcular custo estimado de storage on-chain
      const fileSize = editFile ? editFile.size : 0;
      const storageFeeSol = await getStorageFee(fileSize, irysNodeUrl);
      const storageFeeLamports = Math.round(storageFeeSol * LAMPORTS_PER_SOL);

      const platformWallet = process.env.NEXT_PUBLIC_PLATFORM_WALLET_ADDRESS;
      const liquidityWallet = process.env.NEXT_PUBLIC_TREASURY_WALLET_ADDRESS;
      const storageDestination = await getIrysFundingAddress(irysNodeUrl);
      if (!platformWallet || !liquidityWallet || !storageDestination) {
        throw new Error("Carteiras de destino não configuradas no ambiente.");
      }

      toast.info("Confirme a transação de teste na sua carteira (Rede Simulada)...");
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("confirmed");
      const splitTx = new Transaction().add(
        SystemProgram.transfer({ fromPubkey: publicKey, toPubkey: new PublicKey(platformWallet), lamports: platformLamports }),
        SystemProgram.transfer({ fromPubkey: publicKey, toPubkey: new PublicKey(liquidityWallet), lamports: liquidityLamports }),
        SystemProgram.transfer({ fromPubkey: publicKey, toPubkey: new PublicKey(storageDestination), lamports: storageFeeLamports })
      );
      splitTx.recentBlockhash = blockhash;
      splitTx.feePayer = publicKey;

      const signature = await sendTransaction(splitTx, connection);
      toast.info("Aguardando confirmação on-chain (Rede Simulada)...");
      await connection.confirmTransaction({ signature, blockhash, lastValidBlockHeight }, "confirmed");

      // ── PASSO 2: Upload via Irys Web SDK diretamente no navegador (Não-Custodial) ──
      toast.info("Subindo identidade ao Arweave (Rede Simulada)...");
      
      const connectedWalletName = wallet?.adapter?.name;
      if (!wallet || !wallet.adapter || wallet.adapter.name !== connectedWalletName) {
        throw new Error("Conflito de carteira detectado");
      }
      const irysProvider = wallet.adapter;

      const { metadataUrl, avatarUrl: finalAvatarUrl } = await buildAndUploadIdentity(
        editNickname,
        editFile,
        sbtAvatarUrl || "",
        publicKey.toBase58(),
        irysProvider,
        irysNodeUrl
      );

      // ── PASSO 3: Cobrança Atômica $LAKE em créditos (no Prisma, após transação on-chain) ──
      toast.info(`Debitando ${EDIT_LKZ_COST} $LKZ...`);
      const creditOk = await spendCredit(EDIT_LKZ_COST, "Edição de Identidade Provisória", signature, totalSol);
      if (!creditOk) {
        console.warn("[EditProfile] Upload ok mas débito LKZ falhou. Salvando banco sem débito.");
      }

      // ── PASSO 4: Persistir no banco apenas a URI do Arweave (Soberania de Dados) ──
      const profileRes = await fetch("/api/users/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          walletAddress: publicKey.toBase58(),
          sbtImageUrl: metadataUrl,
          isCitizen: false,
          transactionSignature: signature,  // prova criptográfica de ownership
        }),
      });
      if (!profileRes.ok) throw new Error("Erro ao salvar perfil provisório");

      // ── PASSO 5: Atualizar sessão global reativamente ──
      setSbtIdentity(editNickname.trim(), finalAvatarUrl);
      setSbtImageUrl(metadataUrl);
      toast.success("Perfil provisório salvo na Rede Simulada!");
      setIsEditProfileModalOpen(false);
    } catch (err: any) {
      console.error("[EditProfile Error]", err);
      const errMsg = err.message || String(err);
      if (errMsg.includes("Provider Mismatch") || errMsg.includes("User Rejected") || errMsg.includes("Conflito") || errMsg.includes("Rejected") || errMsg.includes("Timeout")) {
        setIsEditingSaving(false);
      }
      toast.error(`Falha ao salvar: ${errMsg}`);
    } finally {
      setIsEditingSaving(false);
    }
  };


  const handleUpgrade = () => {
    // Migração Inteligente: verifica se o usuário já possui dados provisórios no Arweave
    if (sbtNickname && sbtAvatarUrl) {
      // Herdar dados: pré-preencher o modal com a identidade já criada na Rede Simulada
      setUpgradeNickname(sbtNickname);
      setUpgradePreview(sbtAvatarUrl);
      setUpgradeFile(null); // Arquivo será obtido via fetch do Arweave no handleUpgradeConfirm
      setUpgradeInheritedData(true);
      setUpgradeStep(2); // Pula direto para Valores (usuário não precisa redigitar)
    } else {
      // Fluxo normal: sem dados provisórios
      setUpgradeNickname("");
      setUpgradePreview(null);
      setUpgradeFile(null);
      setUpgradeInheritedData(false);
      setUpgradeStep(1);
    }
    setIsUpgradeModalOpen(true);
  };


  const handleUpgradeConfirm = async () => {
    if (!publicKey) {
      toast.error("Conecte sua carteira primeiro.");
      return;
    }
    if (!upgradeNickname.trim()) {
      toast.error("Por favor, digite um nickname.");
      return;
    }
    // Para dados herdados, o arquivo será baixado do Arweave; para novos, exige upload local
    if (!upgradeFile && !upgradeInheritedData) {
      toast.error("Por favor, selecione uma imagem para seu avatar SBT.");
      return;
    }

    setIsUpgrading(true);
    try {
      // 0. VERIFICAÇÃO DE SALDO LKZ ANTES DA OPERAÇÃO
      if (credits < UPGRADE_LKZ_COST) {
        toast.error(`Saldo insuficiente. Você precisa de ${UPGRADE_LKZ_COST} créditos.`);
        openModal();
        setIsUpgrading(false);
        return;
      }

      // 1. Se herdando dados provisórios, baixar a imagem do Arweave para criar um File local
      let effectiveFile: File | null = upgradeFile;
      if (upgradeInheritedData && !upgradeFile && sbtAvatarUrl) {
        toast.info("Importando imagem provisória do Arweave...");
        const imgResp = await fetch(sbtAvatarUrl);
        if (!imgResp.ok) throw new Error("Não foi possível importar a imagem provisória.");
        const blob = await imgResp.blob();
        effectiveFile = new File([blob], "avatar-herdado.jpg", { type: blob.type || "image/jpeg" });
      }
      if (!effectiveFile) {
        throw new Error("Nenhuma imagem disponível para o upgrade.");
      }

      // 2. Calcular valores para a transação on-chain ($1 USDC em SOL)
      let currentPrice = solPriceUSD;
      if (!currentPrice || currentPrice <= 0) {
        const res = await fetch("https://economia.awesomeapi.com.br/json/last/SOL-USD");
        const data = await res.json();
        currentPrice = parseFloat(data.SOLUSD.ask) || 150;
      }

      const totalUSD = 1;
      const totalSol = totalUSD / currentPrice;
      const totalLamports = Math.round(totalSol * LAMPORTS_PER_SOL);
      const platformLamports = Math.round(totalSol * 0.95 * LAMPORTS_PER_SOL);
      const liquidityLamports = totalLamports - platformLamports;

      // 3. Criar e enviar transação de split 95/5 em SOL na Rede Principal + Custo de bytes
      const platformWallet = process.env.NEXT_PUBLIC_PLATFORM_WALLET_ADDRESS;
      const liquidityWallet = process.env.NEXT_PUBLIC_LIQUIDITY_RECEIVER_WALLET;
      const storageDestination = await getIrysFundingAddress(irysNodeUrl);
      if (!platformWallet || !liquidityWallet || !storageDestination) {
        throw new Error("Carteiras de destino não configuradas no ambiente.");
      }

      // Calcular custo estimado de storage on-chain
      const fileSize = effectiveFile.size;
      const storageFeeSol = await getStorageFee(fileSize, irysNodeUrl);
      const storageFeeLamports = Math.round(storageFeeSol * LAMPORTS_PER_SOL);

      toast.info("Confirme a transação de split na sua carteira...");
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("confirmed");
      const transaction = new Transaction().add(
        SystemProgram.transfer({ fromPubkey: publicKey, toPubkey: new PublicKey(platformWallet), lamports: platformLamports }),
        SystemProgram.transfer({ fromPubkey: publicKey, toPubkey: new PublicKey(liquidityWallet), lamports: liquidityLamports }),
        SystemProgram.transfer({ fromPubkey: publicKey, toPubkey: new PublicKey(storageDestination), lamports: storageFeeLamports })
      );
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;

      const signature = await sendTransaction(transaction, connection);
      toast.info("Aguardando confirmação on-chain...");
      await connection.confirmTransaction({ signature, blockhash, lastValidBlockHeight }, "confirmed");

      // 3.5. REGRA DE ATOMICIDADE: Upload ANTES do débito de $LKZ
      // 4. Upload via Irys Web SDK diretamente no navegador (Não-Custodial)
      toast.info("Subindo identidade soberana ao Arweave (Mainnet — Permanente)...");
      
      const connectedWalletName = wallet?.adapter?.name;
      if (!wallet || !wallet.adapter || wallet.adapter.name !== connectedWalletName) {
        throw new Error("Conflito de carteira detectado");
      }
      const irysProvider = wallet.adapter;

      const { metadataUrl, avatarUrl: sbtUrl } = await buildAndUploadIdentity(
        upgradeNickname,
        effectiveFile,
        sbtAvatarUrl || "",
        publicKey.toBase58(),
        irysProvider,
        irysNodeUrl
      );

      // 4.5. Cobrança de $LKZ — só após upload bem-sucedido
      toast.info(`Debitando ${UPGRADE_LKZ_COST} $LKZ...`);
      const creditOk = await spendCredit(UPGRADE_LKZ_COST, "Cidadania Definitiva (SBT)", signature, totalSol);
      if (!creditOk) {
        // Edge-case: upload ok, débito falhou. Prosseguir para garantir a cidadania.
        console.warn("[Upgrade] Upload ok mas débito LKZ falhou. Prosseguindo com cidadania.");
      }

      // 5. Registrar cidadania no banco (apenas a URI do Arweave) com prova de ownership
      toast.info("Registrando cidadania no banco de dados...");
      const profileRes = await fetch("/api/users/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          walletAddress: publicKey.toBase58(),
          sbtImageUrl: metadataUrl, // O banco salva APENAS a URI do JSON do Arweave
          isCitizen: true,
          transactionSignature: signature,  // prova criptográfica de ownership
        }),
      });
      if (!profileRes.ok) {
        const profileErr = await profileRes.json();
        throw new Error(profileErr.error || "Erro ao salvar perfil");
      }

      // 6. Sincronizar sessão de identidade reativa do NetworkContext
      setTier("CITIZEN");
      setSbtIdentity(upgradeNickname.trim(), sbtUrl);
      setSbtImageUrl(metadataUrl);

      // 7. Confetes e sucesso!
      toast.success("Parabéns! Você agora é um Cidadão Oficial da Lake!");
      setIsUpgradeModalOpen(false);
      triggerConfetti();

    } catch (error: any) {
      console.error("Erro no upgrade de Cidadão:", error);
      const errMsg = error.message || String(error);
      if (errMsg.includes("Provider Mismatch") || errMsg.includes("User Rejected") || errMsg.includes("Conflito") || errMsg.includes("Rejected") || errMsg.includes("Timeout")) {
        setIsUpgrading(false);
      }
      toast.error(`Falha no upgrade: ${errMsg}`);
    } finally {
      setIsUpgrading(false);
    }
  };

  const handleDeleteAsset = (asset: any) => {
    toast(`Tem certeza que deseja excluir '${asset.name}'?`, {
      action: {
        label: "Excluir",
        onClick: async () => {
          try {
            const res = await fetch(`/api/assets/${asset.id}?wallet=${publicKey?.toBase58()}`, {
              method: "DELETE",
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Erro ao excluir");
            fetchPrimaryAssets();
            toast.success("Ativo excluído com sucesso!");
          } catch (err: any) {
            toast.error(`Erro ao excluir: ${err.message}`);
          }
        }
      },
      cancel: {
        label: "Cancelar",
        onClick: () => {}
      }
    });
  };

  const handleForceApproval = (id: string) => {
    toast("Deseja aprovar e publicar este ativo no mercado primário?", {
      action: {
        label: "Aprovar",
        onClick: async () => {
          try {
            const res = await fetch(`/api/assets/${id}?wallet=${publicKey?.toBase58()}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ status: "APPROVED" }),
            });
            if (!res.ok) throw new Error("Falha ao aprovar");
            toast.success("Ativo Aprovado com Sucesso!");
            fetchPrimaryAssets();
          } catch (err: any) {
            toast.error(`Erro: ${err.message}`);
          }
        }
      },
      cancel: {
        label: "Cancelar",
        onClick: () => {}
      }
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Hash copiado para a área de transferência!");
  };

  const openResaleModal = (receipt: any) => {
    setSelectedReceipt(receipt);
    setResaleQty(receipt.quantity);
    setResalePrice(Number(receipt.asset?.tokenPrice || 0));
  };

  const closeResaleModal = () => {
    setSelectedReceipt(null);
    setResaleQty(1);
    setResalePrice(0);
  };

  const executeListing = async () => {
    if (!publicKey || !selectedReceipt) return;
    if (!solPriceUSD) {
      toast.info("Aguarde a conexão com o oráculo de preços.");
      return;
    }

    if (resaleQty <= 0 || resaleQty > selectedReceipt.quantity) {
      toast.error("Quantidade inválida.");
      return;
    }

    if (resalePrice <= 0) {
      toast.error("Defina um preço válido.");
      return;
    }

    setIsListingId(selectedReceipt.id);
    try {
      // 1. Cobrar Taxa da Rede na Phantom ($0.50 USD)
      const exactFeeSol = 0.50 / solPriceUSD;
      const safeFeeSol = exactFeeSol * 1.01; // 1% buffer
      const LISTING_FEE = Math.floor(safeFeeSol * LAMPORTS_PER_SOL);

      const targetPubKeyStr = isMainnet
        ? (process.env.NEXT_PUBLIC_LIQUIDITY_RECEIVER_WALLET || "8DzctwAnUeXTy2xbUz1z5nfr3xfqCWYCxYAVTni7XvRH")
        : (process.env.NEXT_PUBLIC_TREASURY_WALLET_ADDRESS || "CXqfj7vFFrpBMVaj8fuyQkGwFgHktdyYVDju723hnmWa");

      const treasuryPubKey = new PublicKey(targetPubKeyStr);

      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: treasuryPubKey,
          lamports: LISTING_FEE,
        })
      );

      const latestBlockhash = await connection.getLatestBlockhash("confirmed");
      transaction.recentBlockhash = latestBlockhash.blockhash;
      transaction.feePayer = publicKey;

      const signature = await sendTransaction(transaction, connection);
      console.log("[Resale] Transação enviada. Assinatura:", signature);

      await connection.confirmTransaction({
        signature,
        blockhash: latestBlockhash.blockhash,
        lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
      }, "confirmed");

      // 2. Chamar Rota Backend para debitar 5 Créditos e mudar status
      const res = await fetch("/api/invest/list-resale", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          walletAddress: publicKey.toBase58(),
          transactionSignature: signature,
          cryptoAmount: safeFeeSol,
          receiptId: selectedReceipt.id,
          resaleQty: Number(resaleQty),
          resalePrice: Number(resalePrice)
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Falha ao registrar listamento no servidor.");
      }

      toast.success("Ativo listado no mercado secundário com sucesso!");
      closeResaleModal();
      fetchReceipts(); // Recarregar a lista
      router.refresh(); // Sync Header

    } catch (err: any) {
      console.error("[Resale Error]", err);
      toast.error(`Falha no listamento: ${err.message}`);
    } finally {
      setIsListingId(null);
    }
  };

  // ── Dados derivados para o painel de métricas ────────────────────────────
  const walletShort = publicKey
    ? `${publicKey.toBase58().slice(0, 4)}...${publicKey.toBase58().slice(-4)}`
    : null;
  const earnedCount = earned.length;
  const earnedPct = totalMedals > 0 ? Math.round((earnedCount / totalMedals) * 100) : 0;

  // ── Identidade digital de sessão ─────────────────────────────────────────
  const baseNickname = visitorOnChain?.nickname || sbtNickname || null;
  const avatarUrl = visitorOnChain?.avatarUrl || sbtAvatarUrl || null;
  const displayName = baseNickname
    ? generateUniqueNickname(baseNickname, publicKey ? publicKey.toBase58() : null)
    : publicKey
    ? `ID LAKE...${publicKey.toBase58().slice(-4)}`
    : "Conecte sua carteira";
  // LKZ ID formatado: zero-padding de 5 dígitos (ex: #00042)
  const lkzId = `LKZ-#${String(MOCK_CITIZEN_DATA.identity.idNumber).padStart(5, "0")}`;
  // isPro: derivado do mock por ora; futuramente virá do isEarned("fase-pro-institucional")
  const isUserPro = MOCK_CITIZEN_DATA.identity.isPro;
  // ── Dual-Tier: controla toda renderização condicional VISITOR vs CITIZEN ──
  // Derivado dinamicamente do NetworkContext
  const isVisitor = currentTier === 'VISITOR';

  // ════════════════════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-slate-50 to-blue-50/30 relative">
      <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">

        {/* ══════════════════════════════════════════════════════════════════
            SEÇÃO 1: LAKE ID CARD (Header de Identidade)
        ══════════════════════════════════════════════════════════════════ */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 p-1 shadow-2xl shadow-blue-950/30">
          {/* Glow decorativo */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/4 pointer-events-none" />
          <div className="absolute bottom-0 left-20 w-48 h-48 bg-indigo-500/10 rounded-full blur-[60px] translate-y-1/2 pointer-events-none" />

          <div className="relative rounded-[22px] bg-slate-900/80 backdrop-blur-xl p-6 md:p-8">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">

              {/* Avatar + botão de edição provisória */}
              <div className="flex flex-col items-center gap-2 shrink-0">
                {/* Avatar — condicional: imagem Arweave ou ícone genérico */}
                <div className="relative group">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30 ring-2 ring-white/10 overflow-hidden">
                    {avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={avatarUrl}
                        alt={`Avatar de ${baseNickname}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-9 h-9 text-white/80" />
                    )}
                  </div>
                  {!sbtImageUrl && (
                    <button
                      onClick={() => {
                        if (isVisitor) {
                          handleEditProfile();
                        } else {
                          toast.info("Identidade permanentemente cunhada on-chain (SBT).");
                        }
                      }}
                      title={isVisitor ? "Editar perfil provisório" : "Identidade SBT"}
                      className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 flex items-center justify-center transition-colors group-hover:border-white/40"
                    >
                      <Camera className="w-3.5 h-3.5 text-white/70" />
                    </button>
                  )}
                </div>

                {/* Botão de edição provisória — exclusivo para VISITOR sem sbtImageUrl */}
                {isVisitor && publicKey && !sbtImageUrl && (
                  <button
                    onClick={handleEditProfile}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-orange-500/15 hover:bg-orange-500/25 border border-orange-500/30 hover:border-orange-400/50 text-orange-400 text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap"
                    title="Editar seus dados provisórios na Rede Simulada"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    Editar Dados
                  </button>
                )}

                {/* Ícone de 'Carimbo' com o texto 'registro Intraferível' apontando para Arweave */}
                {sbtImageUrl && (
                  <a
                    href={`/identity/${sbtImageUrl.split("/").pop()}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/40 hover:border-indigo-400/60 text-indigo-300 text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap shadow-sm shadow-indigo-500/10"
                    title="Ver certidão de registro criptográfico eterno e imutável"
                  >
                    <Stamp className="w-3 h-3 text-indigo-400" />
                    registro Intraferível
                  </a>
                )}

                {/* Botão "Ver Certidão" - posicionado embaixo do carimbo e alinhado visualmente */}
                {isVisitor && sbtImageUrl && (
                  <button
                    onClick={() => setIsCertidaoModalOpen(true)}
                    className="mt-1.5 w-full flex items-center justify-center gap-1.5 px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all whitespace-nowrap shadow-sm"
                  >
                    Ver Certidão
                  </button>
                )}
              </div>


              {/* Identidade — hidratada com Mock Service + Dual-Tier */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  {/* Nickname único: baseName + sufixo da wallet (regra SBT) */}
                  <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                    {displayName}
                  </h1>

                  {/* Badge Lake PRO (se isPro = true e CITIZEN) */}
                  {isUserPro && !isVisitor && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 text-[11px] font-bold uppercase tracking-wider">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Lake PRO
                    </span>
                  )}

                  {/* ── DUAL-TIER: Badge Visto Provisório (VISITOR) / Visitante Lake ── */}
                  {isVisitor ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-orange-500/15 border border-orange-500/30 text-orange-400 text-[11px] font-bold uppercase tracking-wider">
                      <AlertCircle className="w-3 h-3" />
                      {sbtImageUrl ? "Visitante Lake" : "Visto Provisório"}
                    </span>
                  ) : (
                    /* Badge Cidadão Oficial (CITIZEN) */
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-[11px] font-bold uppercase tracking-wider">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Cidadão Oficial
                    </span>
                  )}
                </div>

                {/* Linha de sub-identidade: LKZ ID + wallet + rede */}
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  {/* LKZ ID — número sequencial mockado */}
                  <span className="text-[11px] font-mono font-bold text-blue-400/80 bg-blue-500/10 px-2 py-0.5 rounded-md">
                    {lkzId}
                  </span>
                  <p className="text-sm text-slate-400 flex items-center gap-2">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    {publicKey ? (
                      <span className="font-mono">
                        {walletShort} · {isMainnet ? "Rede Principal" : "Rede Simulada"}
                      </span>
                    ) : (
                      <span>Carteira não conectada</span>
                    )}
                  </p>
                </div>

                {/* Seletor de Rede para Cidadãos Lake (Modo Simulador) */}
                {!isVisitor && (
                  <div className="mt-3 flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-400">Modo de Operação:</span>
                    <button
                      onClick={toggleNetworkPreference}
                      className={`px-3 py-1 rounded-full text-xs font-extrabold transition-all duration-300 shadow-md ${
                        userNetworkPreference === "MAINNET"
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30"
                          : "bg-orange-500/20 text-orange-400 border border-orange-500/30 hover:bg-orange-500/30"
                      }`}
                      title={
                        userNetworkPreference === "MAINNET"
                          ? "Rede Principal. Clique para alternar para a Rede Simulada."
                          : "Rede Simulada. Clique para alternar para a Rede Principal."
                      }
                    >
                      {userNetworkPreference === "MAINNET" ? "🟢 Rede Principal" : "🟠 Rede Simulada"}
                    </button>
                  </div>
                )}

                {/* Barra de progresso da Trilha */}
                <div className="mt-3 flex items-center gap-3">
                  <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-blue-400 to-indigo-500 transition-all duration-700"
                      style={{ width: `${earnedPct}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold text-slate-400 shrink-0">
                    {earnedCount}/{totalMedals} Medalhas
                  </span>
                </div>

                {/* ── DUAL-TIER: Banner Premium "Visto Definitivo" (somente VISITOR) ── */}
                {isVisitor && (
                  <div className="mt-5 relative overflow-hidden rounded-2xl" style={{
                    background: "linear-gradient(135deg, #0a0f1e 0%, #0d1833 30%, #111827 55%, #1a1000 80%, #0a0f1e 100%)",
                    boxShadow: "0 0 0 1px rgba(245,158,11,0.18), 0 8px 32px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.05)"
                  }}>

                    {/* ── Shimmer overlay — brilho de luz diagonal passando pelo card ── */}
                    <div
                      className="pointer-events-none absolute inset-0 z-10"
                      style={{
                        background: "linear-gradient(105deg, transparent 35%, rgba(255,210,120,0.055) 50%, transparent 65%)",
                        backgroundSize: "200% 100%",
                        animation: "lake-shimmer 4s ease-in-out infinite",
                      }}
                    />

                    {/* ── Glow de canto superior direito ── */}
                    <div className="pointer-events-none absolute -top-6 -right-6 w-32 h-32 rounded-full opacity-25"
                      style={{ background: "radial-gradient(circle, rgba(245,158,11,0.4) 0%, transparent 70%)" }}
                    />
                    {/* ── Glow de canto inferior esquerdo ── */}
                    <div className="pointer-events-none absolute -bottom-4 -left-4 w-24 h-24 rounded-full opacity-20"
                      style={{ background: "radial-gradient(circle, rgba(59,130,246,0.5) 0%, transparent 70%)" }}
                    />

                    <div className="relative z-20 flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 md:p-5">

                      {/* Ícone do escudo animado */}
                      <div className="shrink-0 w-12 h-12 rounded-xl flex items-center justify-center"
                        style={{ background: "linear-gradient(135deg, rgba(245,158,11,0.25), rgba(234,88,12,0.15))", border: "1px solid rgba(245,158,11,0.3)" }}>
                        <ShieldCheck className="w-6 h-6 text-amber-400 drop-shadow-sm" style={{ filter: "drop-shadow(0 0 6px rgba(245,158,11,0.6))" }} />
                      </div>

                      {/* Texto */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-extrabold text-white tracking-tight mb-1"
                          style={{ textShadow: "0 1px 8px rgba(245,158,11,0.2)" }}>
                          O Visto Definitivo: Torne-se um Cidadão Lake
                        </p>
                        <p className="text-[11.5px] leading-relaxed"
                          style={{ color: "rgba(200,210,230,0.75)" }}>
                          Uma identidade exclusiva e eterna, propriedade 100% sua. Desbloqueie acesso vitalício aos ativos e privilégios exclusivos da{" "}
                          <span className="font-bold" style={{ color: "rgba(252,211,77,0.9)" }}>Rede Principal</span>.
                        </p>
                      </div>

                      {/* Botão CTA com pulse suave */}
                      <button
                        onClick={handleUpgrade}
                        disabled={isUpgrading}
                        title="Garantir Visto de Cidadão na Rede Principal por $1 USDC"
                        className="shrink-0 relative flex items-center gap-2 px-4 py-2.5 rounded-xl font-extrabold text-xs uppercase tracking-wider transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{
                          background: isUpgrading
                            ? "rgba(51,65,85,0.8)"
                            : "linear-gradient(135deg, #d97706, #b45309)",
                          boxShadow: isUpgrading
                            ? "none"
                            : "0 0 0 1px rgba(245,158,11,0.4), 0 4px 16px rgba(180,83,9,0.45)",
                          animation: isUpgrading ? "none" : "lake-btn-pulse 2.8s ease-in-out infinite",
                          color: "#fff",
                        }}
                      >
                        {isUpgrading ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            Cunhando...
                          </>
                        ) : (
                          <>
                            <Zap className="w-3.5 h-3.5" />
                            Garantir Visto · $1 USDC
                          </>
                        )}
                      </button>
                    </div>

                    {/* Injeção de keyframes CSS via style tag — shimmer + pulse do botão */}
                    <style>{`
                      @keyframes lake-shimmer {
                        0%   { background-position: 200% center; }
                        50%  { background-position: -200% center; }
                        100% { background-position: 200% center; }
                      }
                      @keyframes lake-btn-pulse {
                        0%, 100% { box-shadow: 0 0 0 1px rgba(245,158,11,0.4), 0 4px 16px rgba(180,83,9,0.45); }
                        50%      { box-shadow: 0 0 0 3px rgba(245,158,11,0.25), 0 6px 24px rgba(180,83,9,0.65); }
                      }
                    `}</style>
                  </div>
                )}

              </div>

              {/* Ações rápidas */}
              <div className="flex gap-2 shrink-0">
                <Link
                  href="/trail"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white text-sm font-bold transition-all"
                >
                  <Medal className="w-4 h-4 text-yellow-400" />
                  Ver Trilha
                </Link>
                <Link
                  href="/marketplace"
                  onClick={(e) => {
                    e.preventDefault();
                    requireWallet(() => {
                      router.push("/marketplace");
                    });
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold transition-all shadow-lg shadow-blue-500/20"
                >
                  Explorar Mercado
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            SEÇÃO 2: ESPELHO DA WALLET — GRID DE MÉTRICAS
        ══════════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">

          {/* Card A — Wallet Externa */}
          <div className="relative overflow-hidden rounded-2xl bg-white border border-slate-200/80 shadow-sm p-5">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
            <div className="flex items-center gap-2 mb-4">
              <div className="p-1.5 bg-blue-50 rounded-lg">
                <Wallet className="w-4 h-4 text-blue-600" />
              </div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Wallet Externa</p>
              <span className={`ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full ${publicKey ? "text-emerald-600 bg-emerald-50" : "text-slate-400 bg-slate-100"}`}>
                {publicKey ? "Conectada" : "Desconectada"}
              </span>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-bold mb-0.5">Saldo SOL</p>
                  <p className="text-2xl font-extrabold text-slate-800">
                    {publicKey && solBalance !== null ? solBalance.toFixed(4) : "—"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-slate-400 uppercase font-bold mb-0.5">Saldo USDC</p>
                  <p className="text-2xl font-extrabold text-slate-800">
                    {publicKey && usdcBalance !== null ? usdcBalance.toFixed(2) : "—"}
                  </p>
                </div>
              </div>
              {solPriceBRL && (
                <p className="text-xs text-slate-400 border-t border-slate-100 pt-2">
                  SOL/BRL: <span className="font-bold text-slate-600">
                    {solPriceBRL.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                  </span>
                  {solPriceUSD && (
                    <> · SOL/USD: <span className="font-bold text-slate-600">
                      ${solPriceUSD.toFixed(2)}
                    </span></>
                  )}
                </p>
              )}
            </div>
          </div>

          {/* Card B — Ecossistema Lake (Créditos) */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 to-blue-700 border border-indigo-500/30 shadow-sm shadow-indigo-500/20 p-5 text-white">
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full blur-xl pointer-events-none" />
            <div className="flex items-center gap-2 mb-4">
              <div className="p-1.5 bg-white/15 rounded-lg">
                <Coins className="w-4 h-4 text-white" />
              </div>
              <p className="text-xs font-bold text-white/70 uppercase tracking-widest">Ecossistema Lake</p>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-[10px] text-white/60 uppercase font-bold mb-0.5">Créditos $LAKE</p>
                  <p className="text-3xl font-extrabold">
                    {publicKey ? credits : <span className="text-white/40 text-2xl">—</span>}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-white/60 uppercase font-bold mb-0.5">Total Gastos</p>
                  <p className="text-xl font-extrabold text-white/70">—</p>
                </div>
              </div>
              <button
                onClick={() => requireWallet(() => openModal())}
                className="w-full py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-sm font-bold transition-all text-white/90"
              >
                + Comprar Créditos
              </button>
            </div>
          </div>

          {/* Card C — Engajamento / Medalhas */}
          <div className="relative overflow-hidden rounded-2xl bg-white border border-slate-200/80 shadow-sm p-5">
            <div className="absolute top-0 right-0 w-24 h-24 bg-yellow-50 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
            <div className="flex items-center gap-2 mb-4">
              <div className="p-1.5 bg-yellow-50 rounded-lg">
                <Medal className="w-4 h-4 text-yellow-500" />
              </div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Engajamento</p>
            </div>
            <div className="flex items-end justify-between mb-4">
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-bold mb-0.5">Medalhas Conquistadas</p>
                <p className="text-3xl font-extrabold text-slate-800">
                  {earnedCount}
                  <span className="text-base font-bold text-slate-400 ml-1">/ {totalMedals}</span>
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-slate-400 uppercase font-bold mb-0.5">Progresso</p>
                <p className="text-2xl font-extrabold text-indigo-600">{earnedPct}%</p>
              </div>
            </div>
            {/* Mini-grade de medalhas */}
            <div className="flex gap-1.5 flex-wrap">
              {Array.from({ length: totalMedals }).map((_, i) => (
                <div
                  key={i}
                  className={`w-6 h-6 rounded-md flex items-center justify-center transition-all ${
                    i < earnedCount
                      ? "bg-gradient-to-br from-yellow-400 to-amber-500 shadow-sm"
                      : "bg-slate-100"
                  }`}
                >
                  <Star className={`w-3 h-3 ${i < earnedCount ? "text-white" : "text-slate-300"}`} />
                </div>
              ))}
            </div>
            <Link
              href="/trail"
              className="mt-3 text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition-colors"
            >
              Ver conquistas na Trilha
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            SEÇÃO 3: ABAS DE CONTEÚDO (4 abas — 2 originais + 2 novas)
        ══════════════════════════════════════════════════════════════════ */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">

          {/* Barra de abas */}
          {publicKey && !isLoading && (
            <div className="flex border-b border-slate-100 overflow-x-auto no-scrollbar">
              {TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-2 px-5 py-4 text-sm font-bold whitespace-nowrap transition-all border-b-2 ${
                    activeTab === tab.key
                      ? "border-indigo-600 text-indigo-700 bg-indigo-50/50"
                      : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>
          )}

          {/* Corpo das abas */}
          <div className="p-6">
            {isLoading ? (
              <div className="flex justify-center items-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
              </div>
            ) : !publicKey ? (
              <div className="bg-white rounded-2xl p-8 text-center">
                <Wallet className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <h2 className="text-xl font-bold text-slate-800 mb-2">Conecte sua carteira</h2>
                <p className="text-slate-500">Conecte sua carteira Solana para visualizar seus investimentos.</p>
              </div>

            /* ── ABA: MEUS INVESTIMENTOS (lógica original preservada) ── */
            ) : activeTab === "investimentos" ? (
              receipts.length === 0 ? (
                <div className="text-center py-12">
                  <ShieldCheck className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <h2 className="text-xl font-bold text-slate-800 mb-2">Nenhum investimento encontrado</h2>
                  <p className="text-slate-500 mb-6">Você ainda não adquiriu frações de ativos na LakeTokeniza.</p>
                  <Link href="/marketplace" className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors">
                    Explorar Marketplace
                  </Link>
                </div>
              ) : (
                <div className="grid gap-6">
                  {receipts.map((receipt) => {
                    const historicSol = Number(receipt.amountPaidCrypto);
                    const currentBRL = solPriceBRL ? historicSol * solPriceBRL : null;
                    const currentUSD = solPriceUSD ? historicSol * solPriceUSD : null;

                    const originalTokenPriceBRL = Number(receipt.asset?.tokenPrice || 0);
                    const historicTotalBRL = receipt.quantity * originalTokenPriceBRL;

                    const isProfit = currentBRL ? currentBRL > historicTotalBRL : null;
                    const isLoss = currentBRL ? currentBRL < historicTotalBRL : null;

                    return (
                      <div key={receipt.id} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col xl:flex-row gap-6 items-start xl:items-center relative overflow-hidden">

                        {/* Status Ribbon */}
                        {receipt.status === "LISTED_FOR_SALE" && (
                          <div className="absolute -right-12 top-6 bg-amber-500 text-white text-[10px] font-bold uppercase tracking-widest py-1 px-12 rotate-45 shadow-sm z-10">
                            Listado (Venda)
                          </div>
                        )}

                        <div className="flex-1 w-full">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-md uppercase tracking-wider">
                              {receipt.asset?.type || "RWA"}
                            </span>
                            <span className="text-xs text-slate-400 font-medium">
                              Comprado em {new Date(receipt.createdAt).toLocaleString("pt-BR")}
                            </span>
                          </div>
                          <h3 className="text-xl font-extrabold text-slate-900 mb-1">
                            {receipt.asset?.name || "Ativo Desconhecido"}
                          </h3>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 text-sm">
                            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                              <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">Quantidade</p>
                              <p className="font-extrabold text-slate-800 text-lg">{receipt.quantity} <span className="text-xs font-medium text-slate-500">Tokens</span></p>
                            </div>

                            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                              <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">Pago Histórico (SOL)</p>
                              <p className="font-extrabold text-slate-800 text-lg">{historicSol.toFixed(4)} <span className="text-xs font-medium text-slate-500">SOL</span></p>
                            </div>

                            <div className={`p-3 rounded-lg border ${isProfit ? "bg-emerald-50 border-emerald-100" : isLoss ? "bg-rose-50 border-rose-100" : "bg-slate-50 border-slate-100"} col-span-2 md:col-span-2 relative`}>
                              <div className="absolute right-3 top-3">
                                {isProfit ? <TrendingUp className="w-5 h-5 text-emerald-500" /> : isLoss ? <TrendingDown className="w-5 h-5 text-rose-500" /> : null}
                              </div>
                              <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">Valor Atual (Marcação a Mercado)</p>
                              {currentBRL && currentUSD ? (
                                <>
                                  <p className="font-extrabold text-slate-900 text-lg">{currentBRL.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</p>
                                  <p className="text-xs font-medium text-slate-500">~ {currentUSD.toLocaleString("en-US", { style: "currency", currency: "USD" })} USD</p>
                                </>
                              ) : (
                                <p className="font-extrabold text-slate-400 text-sm mt-2">Cotação Indisponível</p>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="w-full xl:w-auto flex flex-col gap-3 min-w-[300px]">
                          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-2 flex items-center gap-1">
                              <ShieldCheck className="w-3 h-3 text-emerald-500" />
                              Recibo Criptográfico
                            </p>
                            <div className="flex items-center gap-2 bg-white border border-slate-200 p-2 rounded-lg">
                              <span className="text-xs font-mono text-slate-600 truncate flex-1" title={receipt.child_fraction_hash}>
                                {receipt.child_fraction_hash.substring(0, 16)}...{receipt.child_fraction_hash.substring(receipt.child_fraction_hash.length - 8)}
                              </span>
                              <button
                                onClick={() => copyToClipboard(receipt.child_fraction_hash)}
                                className="p-1.5 hover:bg-slate-100 rounded-md text-slate-500 transition-colors"
                                title="Copiar Hash"
                              >
                                <Copy className="w-4 h-4" />
                              </button>
                            </div>
                            <div className="mt-3 text-right">
                              <a
                                href={`https://solscan.io/tx/${receipt.txHash}${isVisitor ? "?cluster=devnet" : ""}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[11px] text-indigo-600 font-bold flex items-center justify-end gap-1 hover:underline"
                              >
                                Ver transação <ExternalLink className="w-3 h-3" />
                              </a>
                            </div>
                          </div>

                          {/* Botão Secundário */}
                          {receipt.status === "HELD" && (
                            <button
                              onClick={() => openResaleModal(receipt)}
                              className="w-full py-3 bg-slate-900 hover:bg-indigo-600 disabled:opacity-50 text-white font-extrabold rounded-xl text-sm transition-all shadow-md flex items-center justify-center gap-2"
                            >
                              <Store className="w-4 h-4" />
                              Colocar à Venda
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )

            /* ── ABA: MINHAS EMISSÕES (lógica original preservada) ── */
            ) : activeTab === "emissoes" ? (
              createdAssets.length === 0 ? (
                <div className="text-center py-12">
                  <Store className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <h2 className="text-xl font-bold text-slate-800 mb-2">Nenhuma emissão encontrada</h2>
                  <p className="text-slate-500 mb-6">Você ainda não tokenizou nenhum ativo.</p>
                  <Link href="/tokenize" className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors">
                    Tokenizar Ativo
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {createdAssets.map((asset) => (
                    <div key={asset.id} className="group bg-white border border-slate-200 rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col">
                      {asset.image && asset.image.startsWith("https://") ? (
                        <div className="relative w-full h-48 bg-slate-50 flex items-center justify-center overflow-hidden border-b border-slate-100">
                          <img src={asset.image} alt="Asset" className="object-contain w-full h-full p-4" />
                          {!asset.isDemo && (
                            <div className="absolute top-3 right-3 z-10">
                              <button
                                onClick={() => handleDeleteAsset(asset)}
                                title="Excluir Ativo"
                                className="p-2 rounded-lg bg-white/90 text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors shadow-sm"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className={`relative h-2 w-full shrink-0 ${asset.image || "bg-slate-700"}`}>
                          {!asset.isDemo && (
                            <div className="absolute top-3 right-3 z-10">
                              <button
                                onClick={() => handleDeleteAsset(asset)}
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
                        <div className="flex justify-between items-start gap-2 mb-1">
                          <h3 className="text-lg font-bold truncate">{asset.name}</h3>
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border shrink-0 ${
                            asset.status === "DRAFT"
                              ? "bg-slate-100 text-slate-600 border-slate-200"
                              : asset.status === "PENDING_REVIEW"
                              ? "bg-amber-50 text-amber-600 border-amber-200"
                              : asset.status === "APPROVED"
                              ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                              : "bg-blue-50 text-blue-600 border-blue-200"
                          }`}>
                            {asset.status === "DRAFT" ? "Rascunho" :
                             asset.status === "PENDING_REVIEW" ? "Em Aprovação" :
                             asset.status === "APPROVED" ? "Aprovado" : "Tokenizado"}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 font-medium mb-4">{asset.type}</p>
                        <div className="grid grid-cols-2 gap-4 mb-6">
                          <div><p className="text-[10px] text-slate-400 font-bold uppercase">Preço</p><p className="font-extrabold text-slate-900">{(asset.tokenPrice ? Number(asset.tokenPrice) : 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</p></div>
                          <div><p className="text-[10px] text-slate-400 font-bold uppercase">Rendimento</p><p className="font-extrabold text-emerald-600">8.5% a.a.</p></div>
                        </div>
                        <div className="mt-auto">
                          {asset.status === "APPROVED" || asset.status === "ACTIVE" || asset.status === "TOKENIZED" ? (
                            <Link href={`/dashboard/manage/${asset.id}`} className="w-full block text-center py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-sm transition-colors shadow-sm">
                              Gerenciar Ativo
                            </Link>
                          ) : (
                            <div className="flex gap-2">
                              <Link href={`/dashboard/manage/${asset.id}`} className="flex-1 block text-center py-3 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-lg text-sm transition-colors shadow-sm">
                                Gerenciar
                              </Link>
                              <button
                                onClick={() => handleForceApproval(asset.id)}
                                className="px-4 py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-lg text-sm transition-colors shadow-sm flex-1"
                              >
                                Aprovar
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )

            /* ── ABA: MERCADO SECUNDÁRIO (placeholder) ── */
            ) : activeTab === "secundario" ? (
              <div className="text-center py-16">
                <div className="w-20 h-20 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center mx-auto mb-5">
                  <Store className="w-9 h-9 text-amber-500" />
                </div>
                <h2 className="text-xl font-bold text-slate-800 mb-2">Meus Lotes no Mercado Secundário</h2>
                <p className="text-slate-500 max-w-md mx-auto mb-6 text-sm leading-relaxed">
                  Aqui você verá todos os lotes de tokens que você colocou à venda no mercado P2P.
                  Para listar um lote, vá até <strong>Meus Investimentos</strong> e clique em "Colocar à Venda".
                </p>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Painel completo em desenvolvimento
                </div>
              </div>

            /* ── ABA: FAVORITOS / WATCHLIST (placeholder) ── */
            ) : activeTab === "watchlist" ? (
              <div className="text-center py-16">
                <div className="w-20 h-20 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center mx-auto mb-5">
                  <BookmarkPlus className="w-9 h-9 text-blue-500" />
                </div>
                <h2 className="text-xl font-bold text-slate-800 mb-2">Favoritos (Watchlist)</h2>
                <p className="text-slate-500 max-w-md mx-auto mb-6 text-sm leading-relaxed">
                  Acompanhe os ativos que te interessam em um só lugar. Em breve, você poderá favoritar
                  qualquer ativo do Marketplace e monitorar variações de preço em tempo real.
                </p>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Funcionalidade em desenvolvimento
                </div>
              </div>

            ) : null}
          </div>
        </div>
      </main>

      {/* ══════════════════════════════════════════════════════════════════
          MODAL DE REVENDA (lógica original preservada integralmente)
      ══════════════════════════════════════════════════════════════════ */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl relative animate-in zoom-in-95">
            <button onClick={closeResaleModal} className="absolute top-4 right-4 p-2 text-slate-400 hover:bg-slate-100 rounded-full transition">
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-2xl font-extrabold text-slate-900 mb-2">Venda no Secundário</h2>
            <p className="text-slate-500 text-sm mb-6">
              Você pode vender o seu lote inteiro ou fracioná-lo. Defina a quantidade e o preço unitário.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Quantidade para Venda</label>
                <div className="flex items-center">
                  <input
                    type="number"
                    min={1}
                    max={selectedReceipt.quantity}
                    value={resaleQty}
                    onChange={(e) => setResaleQty(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-3 px-4 text-slate-900 font-bold outline-none focus:ring-2 focus:ring-indigo-500 transition"
                  />
                  <span className="ml-3 text-sm text-slate-500 font-medium">/ {selectedReceipt.quantity} max</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Preço Unitário (BRL)</label>
                <div className="relative">
                  <span className="absolute left-4 top-3 text-slate-400 font-bold">R$</span>
                  <input
                    type="number"
                    min={0.01}
                    step={0.01}
                    value={resalePrice}
                    onChange={(e) => setResalePrice(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-3 pl-10 pr-4 text-slate-900 font-bold outline-none focus:ring-2 focus:ring-indigo-500 transition"
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 bg-amber-50 border border-amber-200 rounded-xl p-4">
              <p className="text-[11px] text-amber-800 font-semibold leading-relaxed">
                <span className="font-bold">Custos de Listagem:</span> Esta operação consumirá 5 Créditos Lake e uma taxa de rede de $0.50 USD (convertidos em SOL) da sua carteira.
              </p>
            </div>

            <button
              onClick={executeListing}
              disabled={isListingId === selectedReceipt.id}
              className="w-full mt-6 py-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-extrabold rounded-xl shadow-lg transition-colors flex items-center justify-center gap-2"
            >
              {isListingId === selectedReceipt.id ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processando...
                </>
              ) : (
                <>Confirmar Listagem</>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          MODAL DE UPGRADE (MINT DO SBT DE CIDADÃO)
      ══════════════════════════════════════════════════════════════════ */}
      {isUpgradeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl relative animate-in zoom-in-95 text-white">
            <button 
              onClick={() => setIsUpgradeModalOpen(false)} 
              disabled={isUpgrading}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition disabled:opacity-50"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck className="w-6 h-6 text-orange-500 animate-pulse" />
              <h2 className="text-2xl font-extrabold text-white">Cidadania Lake</h2>
            </div>
            
            <p className="text-slate-400 text-sm mb-4">
              Preencha sua identidade digital soberana. Seus dados serão cunhados permanentemente na Rede Principal via Arweave.
            </p>

            {/* Banner de Migração Inteligente — exibido quando há dados provisórios para eternizar */}
            {upgradeInheritedData && (
              <div className="flex items-start gap-3 mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                <Zap className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-emerald-300 text-xs font-extrabold uppercase tracking-wide mb-0.5">Metadados provisórios encontrados</p>
                  <p className="text-slate-300 text-xs leading-relaxed">
                    Eternizar estes dados na Rede Principal? Seu nickname e avatar da Rede Simulada foram carregados automaticamente.
                  </p>
                </div>
              </div>
            )}

            {/* Indicador de Etapas */}
            <div className="flex justify-between items-center mb-6 bg-slate-950/30 p-2 rounded-xl border border-slate-800/40 text-xs">
              <div className={`flex items-center gap-1 font-bold ${upgradeStep === 1 ? "text-orange-500" : "text-slate-400"}`}>
                <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[10px]">1</span>
                Perfil
              </div>
              <div className="h-px bg-slate-800 w-8" />
              <div className={`flex items-center gap-1 font-bold ${upgradeStep === 2 ? "text-orange-500" : "text-slate-400"}`}>
                <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[10px]">2</span>
                Valores
              </div>
              <div className="h-px bg-slate-800 w-8" />
              <div className={`flex items-center gap-1 font-bold ${upgradeStep === 3 ? "text-orange-500" : "text-slate-400"}`}>
                <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[10px]">3</span>
                Assinatura
              </div>
            </div>

            {upgradeStep === 1 && (
              <div className="space-y-5 animate-in fade-in duration-300">
                {/* Nickname Input */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Nickname do Cidadão
                  </label>
                  <input
                    type="text"
                    maxLength={15}
                    placeholder="Ex: Zuba, Alice..."
                    value={upgradeNickname}
                    onChange={(e) => setUpgradeNickname(e.target.value)}
                    disabled={isUpgrading}
                    className="w-full bg-slate-950/50 border border-slate-800 rounded-xl py-3 px-4 text-white font-semibold outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition disabled:opacity-50"
                  />
                </div>

                {/* Avatar Upload */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Avatar do Perfil SBT
                  </label>
                  
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-xl bg-slate-950/50 border border-slate-800 flex items-center justify-center overflow-hidden shrink-0">
                      {upgradePreview ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={upgradePreview} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-8 h-8 text-slate-600" />
                      )}
                    </div>
                    
                    <label className="flex-1 cursor-pointer">
                      <span className="inline-block px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 text-xs font-extrabold uppercase tracking-wider text-slate-200 rounded-xl text-center w-full transition duration-200">
                        Selecionar Foto
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        disabled={isUpgrading}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                <button
                  onClick={() => {
                    if (!upgradeNickname.trim()) {
                      toast.error("Por favor, informe seu nickname.");
                      return;
                    }
                    // Aceita dados herdados sem exigir novo upload
                    if (!upgradeFile && !upgradeInheritedData) {
                      toast.error("Por favor, selecione seu avatar.");
                      return;
                    }
                    setUpgradeStep(2);
                  }}
                  className="w-full mt-6 py-4 bg-orange-600 hover:bg-orange-500 text-white font-extrabold rounded-xl transition duration-200"
                >
                  Avançar para Valores
                </button>
              </div>
            )}

            {upgradeStep === 2 && (
              <div className="space-y-5 animate-in fade-in duration-300">
                {/* Banner de herdança na etapa de valores */}
                {upgradeInheritedData && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">
                    <Zap className="w-3.5 h-3.5 shrink-0" />
                    Identidade provisória herdada da Rede Simulada
                  </div>
                )}
                <div className="bg-slate-950/30 border border-slate-850 rounded-2xl p-4 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl overflow-hidden border border-slate-800 shrink-0">
                    {upgradePreview && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={upgradePreview} alt="Avatar" className="w-full h-full object-cover" />
                    )}
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-505 uppercase font-bold">Identidade Proposta</p>
                    <p className="text-base font-extrabold text-white">{upgradeNickname}</p>
                  </div>
                </div>

                {/* Custos formatados */}
                <div className="bg-slate-950/40 border border-orange-500/20 rounded-2xl p-4 space-y-2">
                  <div className="flex justify-between items-center text-xs font-semibold text-slate-400">
                    <span>Valor Final</span>
                    <span className="text-white font-bold">$1.00 USDC</span>
                  </div>
                  <div className="flex justify-between items-center text-xs font-semibold text-slate-400">
                    <span>Custo do Upgrade</span>
                    <span className="text-orange-400 font-bold">{UPGRADE_LKZ_COST} $LKZ</span>
                  </div>
                  <div className="border-t border-slate-800 pt-2 flex justify-between items-center text-xs font-bold text-slate-300">
                    <span>Saldo após débito</span>
                    <span className={credits >= UPGRADE_LKZ_COST ? "text-emerald-400" : "text-red-400"}>
                      {credits - UPGRADE_LKZ_COST} $LKZ
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setUpgradeStep(1)}
                    className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-extrabold rounded-xl text-xs uppercase transition duration-200"
                  >
                    Voltar
                  </button>
                  <button
                    onClick={() => setUpgradeStep(3)}
                    className="flex-[2] py-3 bg-orange-600 hover:bg-orange-500 text-white font-extrabold rounded-xl text-xs uppercase transition duration-200"
                  >
                    Confirmar Valores
                  </button>
                </div>
              </div>
            )}

            {upgradeStep === 3 && (
              <div className="space-y-5 animate-in fade-in duration-300">
                <div className="bg-orange-500/10 border border-orange-500/20 rounded-2xl p-4 text-center">
                  <Lock className="w-8 h-8 text-orange-500 mx-auto mb-2 animate-bounce" />
                  <p className="text-xs font-semibold text-slate-300 leading-relaxed">
                    Você está prestes a assinar a transação de cidadania na rede. Certifique-se de ter saldo suficiente para a taxa de gás da rede.
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setUpgradeStep(2)}
                    disabled={isUpgrading}
                    className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-extrabold rounded-xl text-xs uppercase transition duration-200 disabled:opacity-50"
                  >
                    Voltar
                  </button>
                  <button
                    onClick={handleUpgradeConfirm}
                    disabled={isUpgrading}
                    className="flex-[2] py-3 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 disabled:from-slate-800 disabled:to-slate-800 disabled:opacity-50 text-white font-extrabold rounded-xl text-xs uppercase transition duration-200 flex items-center justify-center gap-2"
                  >
                    {isUpgrading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-orange-400" />
                        <span>Cunhando...</span>
                      </>
                    ) : (
                      <span>Assinar Transação</span>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          MODAL DE EDIÇÃO PROVISÓRIA (REDE SIMULADA)
          Fluxo: Visitante edita seu perfil sem custo, dados salvos no Arweave Devnet.
          NÃO é o fluxo de upgrade (que exige $1 SOL + mint SBT na Rede Principal).
      ══════════════════════════════════════════════════════════════════ */}
      {isEditProfileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-orange-500/30 rounded-3xl w-full max-w-md p-6 shadow-2xl shadow-orange-900/20 relative animate-in zoom-in-95 text-white">
            <button
              onClick={() => setIsEditProfileModalOpen(false)}
              disabled={isEditingSaving}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition disabled:opacity-50"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-2 mb-2">
              <Pencil className="w-5 h-5 text-orange-400" />
              <h2 className="text-xl font-extrabold text-white">Editar Perfil</h2>
              <span className="ml-1 px-2 py-0.5 rounded-full bg-orange-500/15 border border-orange-500/30 text-orange-400 text-[10px] font-bold uppercase tracking-wider">
                Rede Simulada
              </span>
            </div>

            {/* ⚠️ Banner de Aviso de Sandbox — obrigatório pelo Tech Lead */}
            <div className="flex items-start gap-3 mb-4 p-3 rounded-xl bg-orange-500/10 border border-orange-500/30">
              <AlertCircle className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="text-orange-300 text-xs font-extrabold uppercase tracking-wide mb-0.5">Dados Provisórios</p>
                <p className="text-slate-300 text-xs leading-relaxed">
                  Estes dados são <strong className="text-orange-300">exclusivos da Rede Simulada</strong>. Eles só se tornarão <strong className="text-white">soberanos e permanentes</strong> após a migração para a Rede Principal.
                </p>
              </div>
            </div>

            {/* Indicador de Etapas — mesma memória muscular do Upgrade */}
            <div className="flex justify-between items-center mb-6 bg-slate-950/30 p-2 rounded-xl border border-slate-800/40 text-xs">
              <div className={`flex items-center gap-1 font-bold ${editStep === 1 ? "text-orange-500" : "text-slate-400"}`}>
                <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[10px]">1</span>
                Perfil
              </div>
              <div className="h-px bg-slate-800 w-8" />
              <div className={`flex items-center gap-1 font-bold ${editStep === 2 ? "text-orange-500" : "text-slate-400"}`}>
                <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[10px]">2</span>
                Valores
              </div>
              <div className="h-px bg-slate-800 w-8" />
              <div className={`flex items-center gap-1 font-bold ${editStep === 3 ? "text-orange-500" : "text-slate-400"}`}>
                <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[10px]">3</span>
                Confirmar
              </div>
            </div>

            {/* ── Step 1: Perfil ── */}
            {editStep === 1 && (
              <div className="space-y-5 animate-in fade-in duration-300">
                {/* Nickname */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Nickname Provisório
                  </label>
                  <input
                    type="text"
                    maxLength={15}
                    placeholder="Ex: Zuba, Alice..."
                    value={editNickname}
                    onChange={(e) => setEditNickname(e.target.value)}
                    disabled={isEditingSaving}
                    className="w-full bg-slate-950/50 border border-slate-700 focus:border-orange-500 rounded-xl py-3 px-4 text-white font-semibold outline-none focus:ring-2 focus:ring-orange-500/40 transition disabled:opacity-50"
                  />
                </div>

                {/* Avatar Upload */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Avatar Provisório (Opcional)
                  </label>
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-xl bg-slate-950/50 border border-slate-700 flex items-center justify-center overflow-hidden shrink-0">
                      {editPreview ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={editPreview} alt="Preview do avatar" className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-6 h-6 text-slate-500" />
                      )}
                    </div>
                    <label className="flex-1 cursor-pointer group">
                      <div className="flex items-center justify-center gap-2 border-2 border-dashed border-slate-700 group-hover:border-orange-500/50 rounded-xl p-3 transition-colors">
                        <Camera className="w-4 h-4 text-slate-400 group-hover:text-orange-400 transition-colors" />
                        <span className="text-slate-400 group-hover:text-orange-300 text-xs font-semibold transition-colors">
                          {editFile ? editFile.name : "Selecionar imagem"}
                        </span>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) {
                            setEditFile(f);
                            const reader = new FileReader();
                            reader.onloadend = () => setEditPreview(reader.result as string);
                            reader.readAsDataURL(f);
                          }
                        }}
                        disabled={isEditingSaving}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                <button
                  onClick={() => {
                    if (!editNickname.trim()) {
                      toast.error("Por favor, informe seu nickname.");
                      return;
                    }
                    setEditStep(2);
                  }}
                  className="w-full mt-2 py-4 bg-orange-600 hover:bg-orange-500 text-white font-extrabold rounded-xl transition duration-200"
                >
                  Avançar para Valores
                </button>
              </div>
            )}

            {/* ── Step 2: Valores ── */}
            {editStep === 2 && (
              <div className="space-y-5 animate-in fade-in duration-300">
                {/* Preview do perfil configurado */}
                <div className="bg-slate-950/30 border border-slate-800 rounded-2xl p-4 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl overflow-hidden border border-slate-700 shrink-0">
                    {editPreview ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={editPreview} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-slate-800 flex items-center justify-center">
                        <User className="w-5 h-5 text-slate-500" />
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase font-bold">Identidade Proposta</p>
                    <p className="text-base font-extrabold text-white">{editNickname}</p>
                    <p className="text-[10px] text-orange-400/70 font-semibold">Rede Simulada</p>
                  </div>
                </div>

                {/* Custos */}
                <div className="bg-slate-950/40 border border-orange-500/20 rounded-2xl p-4 space-y-2">
                  <div className="flex justify-between items-center text-xs font-semibold text-slate-400">
                    <span>Custo de Edição</span>
                    <span className="text-orange-400 font-bold">{EDIT_LKZ_COST} $LKZ</span>
                  </div>
                  <div className="flex justify-between items-start text-xs font-semibold text-slate-400">
                    <span>Custo em SOL</span>
                    <div className="text-right">
                      <span className="text-white font-bold block">$1.00 USD</span>
                      <span className="text-slate-500 text-[10px] font-semibold">Debito na rede simulada.</span>
                    </div>
                  </div>
                  <div className="border-t border-slate-800 pt-2 flex justify-between items-center text-xs font-bold text-slate-300">
                    <span>Saldo após débito</span>
                    <span className={credits >= EDIT_LKZ_COST ? "text-emerald-400" : "text-red-400"}>
                      {credits - EDIT_LKZ_COST} $LKZ
                    </span>
                  </div>
                </div>

                {credits < EDIT_LKZ_COST && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    Saldo insuficiente. Você precisa de {EDIT_LKZ_COST} $LKZ.
                    <button onClick={openModal} className="ml-auto underline font-bold hover:text-red-300 transition-colors whitespace-nowrap">
                      Comprar $LKZ
                    </button>
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => setEditStep(1)}
                    className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-extrabold rounded-xl text-xs uppercase transition duration-200"
                  >
                    Voltar
                  </button>
                  <button
                    onClick={() => setEditStep(3)}
                    disabled={credits < EDIT_LKZ_COST}
                    className="flex-[2] py-3 bg-orange-600 hover:bg-orange-500 disabled:bg-slate-800 disabled:opacity-50 text-white font-extrabold rounded-xl text-xs uppercase transition duration-200"
                  >
                    Confirmar Valores
                  </button>
                </div>
              </div>
            )}

            {/* ── Step 3: Confirmar ── */}
            {editStep === 3 && (
              <div className="space-y-5 animate-in fade-in duration-300">
                <div className="bg-orange-500/10 border border-orange-500/20 rounded-2xl p-4 text-center">
                  <Pencil className="w-8 h-8 text-orange-400 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-slate-300 leading-relaxed">
                    Ao confirmar, <strong className="text-white">{EDIT_LKZ_COST} $LKZ</strong> serão debitados da sua conta e seu perfil provisório será salvo permanentemente no <strong className="text-orange-300">Arweave</strong> da Rede Simulada.
                  </p>
                </div>

                <div className="bg-slate-950/40 border border-slate-800 rounded-xl p-3 space-y-1.5 text-xs text-slate-400">
                  <div className="flex justify-between">
                    <span>Nickname</span>
                    <span className="text-white font-bold">{editNickname}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Custo</span>
                    <span className="text-orange-400 font-bold">{EDIT_LKZ_COST} $LKZ</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Ambiente</span>
                    <span className="text-orange-300 font-bold">Rede Simulada</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setEditStep(2)}
                    disabled={isEditingSaving}
                    className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-extrabold rounded-xl text-xs uppercase transition duration-200 disabled:opacity-50"
                  >
                    Voltar
                  </button>
                  <button
                    onClick={handleEditProfileSave}
                    disabled={isEditingSaving}
                    className="flex-[2] py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 disabled:from-slate-800 disabled:to-slate-800 disabled:opacity-50 text-white font-extrabold rounded-xl text-xs uppercase transition duration-200 flex items-center justify-center gap-2"
                  >
                    {isEditingSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Salvando...</span>
                      </>
                    ) : (
                      <>
                        <ArrowRight className="w-4 h-4" />
                        <span>Salvar na Rede Simulada</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <CertidaoModal
        isOpen={isCertidaoModalOpen}
        onClose={() => setIsCertidaoModalOpen(false)}
        ownerWallet={publicKey?.toBase58() || ''}
        certidaoId={`CERT-${publicKey?.toBase58().slice(0, 6)}`}
      />

    </div>
  );
}
