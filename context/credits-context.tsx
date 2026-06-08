"use client";
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import {
  SystemProgram,
  Transaction,
  PublicKey,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import { getSolPrice } from "@/lib/solana-oracle";
import { useNetworkHub } from "@/context/NetworkContext";
import { toast } from "sonner";

// Credit Plans Configuration
export interface CreditPlan {
  id: string;
  name: string;
  credits: number;
  priceUSD: number; // Base price in USD
  priceEth: string; // Keeping the prop name to not break UI, but this is irrelevant now
  priceEthDisplay: string; // Keeping prop name
  priceUsdt: string; // Price in USDT (display only)
  popular?: boolean;
}

export const CREDIT_PLANS: CreditPlan[] = [
  {
    id: "trial",
    name: "Trial",
    credits: 5,
    priceUSD: 0.35,
    priceEth: "0x6C6B935B8BBD4000",
    priceEthDisplay: "0.00012",
    priceUsdt: "~$0.35",
  },
  {
    id: "starter",
    name: "Starter",
    credits: 10,
    priceUSD: 1.15,
    priceEth: "0x1550F7DCA70000",
    priceEthDisplay: "0.00038",
    priceUsdt: "~$1.15",
  },
  {
    id: "pro",
    name: "Pro",
    credits: 50,
    priceUSD: 1.75,
    priceEth: "0x20C855D7F50000",
    priceEthDisplay: "0.00058",
    priceUsdt: "~$1.75",
    popular: true,
  },
  {
    id: "expert",
    name: "Expert",
    credits: 100,
    priceUSD: 3.5,
    priceEth: "0x51DAC207A00000",
    priceEthDisplay: "0.00117",
    priceUsdt: "~$3.50",
  },
];

type TransactionType = "COMPRA" | "USO";

export interface TransactionRecord {
  id: string;
  type: TransactionType;
  amount: string;
  hash?: string;
  date: string;
  planId?: string;
  solAmount?: number;
}

interface CreditsContextType {
  credits: number;
  faucetCreditsPurchased: number;
  buyCredits: (plan: CreditPlan) => Promise<boolean>;
  spendCredit: (amount?: number, description?: string, txHash?: string, solAmount?: number) => Promise<boolean>;
  isLoading: boolean;
  history: TransactionRecord[];
  openHistory: () => void;
  isHistoryOpen: boolean;
  closeHistory: () => void;
  refreshCredits: () => Promise<void>;
  addTransactionRecord: (tx: TransactionRecord) => void;
  // Modal controls
  isModalOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
  // Oracle controls
  solPrice: number | null;
  isPriceLoading: boolean;
  refreshSolPrice: () => Promise<number>;
  oracleError: string | null;
}

const CreditsContext = createContext<CreditsContextType | undefined>(undefined);

export function CreditsProvider({ children }: { children: ReactNode }) {
  const { publicKey, connected, sendTransaction } = useWallet();
  const { connection } = useConnection();
  const { isMainnet } = useNetworkHub();
  const walletAddress = publicKey?.toBase58();

  const [credits, setCredits] = useState(0);
  const [faucetCreditsPurchased, setFaucetCreditsPurchased] = useState(0);
  const [history, setHistory] = useState<TransactionRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [solPrice, setSolPrice] = useState<number | null>(null);
  const [isPriceLoading, setIsPriceLoading] = useState(false);
  const [oracleError, setOracleError] = useState<string | null>(null);

  // Refresh dynamic SOL price from dual oracle
  const refreshSolPrice = async (): Promise<number> => {
    setIsPriceLoading(true);
    setOracleError(null);
    try {
      const price = await getSolPrice(connection);
      setSolPrice(price);
      return price;
    } catch (error: any) {
      console.error("❌ Erro ao carregar cotação do SOL:", error);
      setOracleError(
        "Fontes Oracle temporariamente offline. Operando em modo de redundância segura."
      );
      // Fallback safe value to guarantee operation if oracle fails completely
      setSolPrice(150);
      return 150;
    } finally {
      setIsPriceLoading(false);
    }
  };

  // Load price and poll for updates periodically
  useEffect(() => {
    refreshSolPrice();
    const interval = setInterval(() => {
      refreshSolPrice();
    }, 60000);
    return () => clearInterval(interval);
  }, [connection]);

  // Fetch credits from database when wallet connects
  const refreshCredits = async () => {
    if (!walletAddress || !connected) {
      setCredits(0);
      return;
    }

    try {
      const response = await fetch(
        `/api/users/credits?wallet=${encodeURIComponent(walletAddress)}`
      );
      const data = await response.json();

      if (response.ok) {
        setCredits(data.credits || 0);
        console.log(`✅ Créditos carregados do banco: ${data.credits}`);
      } else if (response.status === 404) {
        const validationResponse = await fetch("/api/users/validate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ walletAddress }),
        });
        const validationData = await validationResponse.json();

        if (validationResponse.ok) {
          setCredits(validationData.user?.credits || 0);
          console.log(
            `✅ Usuário criado e créditos carregados: ${validationData.user?.credits || 0}`
          );
        } else {
          console.error("Erro ao validar usuário:", validationData.error);
        }
      } else {
        console.error("Erro ao carregar créditos:", data.error);
      }
    } catch (error) {
      console.error("Erro ao buscar créditos:", error);
    }
  };

  // Load credits from database when wallet connects (with LGPD clean up on disconnect)
  useEffect(() => {
    if (!connected || !walletAddress) {
      // Strict LGPD clean up: wipe all application state caches on disconnect
      setCredits(0);
      setHistory([]);
      console.log(
        "🧹 [LGPD Privacy] Carteira desconectada. Cache e estados residuais limpos com sucesso."
      );
    } else {
      refreshCredits();
      try {
        const savedHistory = localStorage.getItem(`history_${walletAddress}`);
        setHistory(savedHistory ? JSON.parse(savedHistory) : []);
      } catch (error) {
        console.error("Erro ao carregar histórico local:", error);
        localStorage.removeItem(`history_${walletAddress}`);
        setHistory([]);
      }
    }
  }, [walletAddress, connected]);

  const saveHistoryToLocal = (newHistory: TransactionRecord[]) => {
    setHistory(newHistory);
    if (walletAddress) {
      localStorage.setItem(
        `history_${walletAddress}`,
        JSON.stringify(newHistory)
      );
    }
  };

  const addTransactionRecord = (tx: TransactionRecord) => {
    saveHistoryToLocal([tx, ...history]);
  };

  /**
   * Compra créditos com base no plano selecionado
   * @param plan - Plano de créditos selecionado
   * @returns true se a compra foi bem-sucedida
   */
  const buyCredits = async (plan: CreditPlan): Promise<boolean> => {
    if (!publicKey || !walletAddress) {
      toast.error("Conecte sua carteira primeiro.");
      return false;
    }

    // Validação de Tokenomics (Limite de Subsídio em Devnet)
    if (!isMainnet) {
      if (faucetCreditsPurchased + plan.credits > 300) {
        toast.error("Limite de laboratório (300 LKZ) atingido...");
        return false;
      }
    }

    setIsLoading(true);

    try {
      console.log(
        `🛒 Iniciando compra: ${plan.name} (${plan.credits} créditos)`
      );

      if (!process.env.NEXT_PUBLIC_PLATFORM_WALLET_ADDRESS) {
        throw new Error("Wallet de destino não configurada");
      }

      // Fetch the absolute latest price directly from our oracle before initiating transaction
      let currentPrice = solPrice;
      if (!currentPrice || currentPrice <= 0) {
        currentPrice = await refreshSolPrice();
      }

      const solAmount = plan.priceUSD / currentPrice;
      const lamportsAmount = Math.round(solAmount * LAMPORTS_PER_SOL);
      console.log(
        `📊 [Transação] Cotação: $${currentPrice.toFixed(2)} USD | Plano: $${plan.priceUSD} USD | SOL: ${solAmount.toFixed(6)} | Lamports: ${lamportsAmount}`
      );

      // TODO: Implementar lógica de 'Gasless Transaction' (Fee Payer) para contas novas com 0 SOL no futuro.
      const { blockhash, lastValidBlockHeight } =
        await connection.getLatestBlockhash("confirmed");

      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: new PublicKey(
            process.env.NEXT_PUBLIC_PLATFORM_WALLET_ADDRESS
          ),
          lamports: lamportsAmount,
        })
      );

      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;

      // Execute blockchain transaction to Treasury Wallet
      const signature = await sendTransaction(transaction, connection);
      await connection.confirmTransaction(
        {
          signature,
          blockhash,
          lastValidBlockHeight,
        },
        "confirmed"
      );

      const txHash = signature;
      console.log(`📤 Transação confirmada: ${txHash}`);

      // Add credits via API (with audit log)
      const response = await fetch("/api/users/credits", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          walletAddress,
          amount: plan.credits,
          planId: plan.id,
          txHash: txHash,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setCredits(data.credits);
        
        // Atualizar acumulador se estiver na Devnet
        if (!isMainnet) {
          setFaucetCreditsPurchased(prev => prev + plan.credits);
        }

        const newTx: TransactionRecord = {
          id: Date.now().toString(),
          type: "COMPRA",
          amount: `+${plan.credits} Créditos`,
          hash: txHash,
          date: new Date().toLocaleString("pt-BR"),
          planId: plan.id,
          solAmount: solAmount,
        };

        saveHistoryToLocal([newTx, ...history]);
        setIsModalOpen(false);

        console.log(`✅ Compra realizada! Novo saldo: ${data.credits}`);
        toast.success(`✅ Compra realizada! Você agora tem ${data.credits} créditos.`);

        return true;
      } else {
        throw new Error(data.error || "Erro ao adicionar créditos");
      }
    } catch (error: any) {
      console.error("Erro na compra de créditos:", error);
      toast.error("Compra cancelada ou falhou. Tente novamente.");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Gasta créditos para usar funcionalidade paga
   * @param amount Quantidade de créditos a debitar (padrão: 3)
   * @returns true se o crédito foi debitado com sucesso
   */
  const spendCredit = async (amount: number = 3, description?: string, txHash?: string, solAmount?: number): Promise<boolean> => {
    if (!walletAddress) {
      toast.error("Conecte sua carteira primeiro.");
      return false;
    }

    if (credits < amount) {
      toast.error(`Saldo insuficiente. Você precisa de ${amount} créditos.`);
      setIsModalOpen(true); // Open modal to buy credits
      return false;
    }

    setIsLoading(true);

    try {
      // Spend credit via API
      const response = await fetch("/api/users/credits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          walletAddress,
          amount: amount,
          action: "spend",
          description: description || "Simulação de Tokenização (Web3)",
          txHash,
          solAmount,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setCredits(data.credits);

        const newTx: TransactionRecord = {
          id: Date.now().toString(),
          type: "USO",
          amount: `-${amount} Créditos`,
          hash: txHash || "LZ-" + Math.random().toString(36).substr(2, 9).toUpperCase(),
          date: new Date().toLocaleString("pt-BR"),
          solAmount,
        };

        saveHistoryToLocal([newTx, ...history]);
        console.log(`✅ Crédito gasto. Saldo: ${data.credits}`);
        return true;
      } else {
        toast.error(data.error || "Erro ao gastar crédito");
        return false;
      }
    } catch (error) {
      console.error("Erro ao gastar crédito:", error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <CreditsContext.Provider
      value={{
        credits,
        faucetCreditsPurchased,
        buyCredits,
        spendCredit,
        isLoading,
        history,
        isHistoryOpen,
        openHistory: () => setIsHistoryOpen(true),
        closeHistory: () => setIsHistoryOpen(false),
        refreshCredits,
        addTransactionRecord,
        // Modal controls
        isModalOpen,
        openModal: () => setIsModalOpen(true),
        closeModal: () => setIsModalOpen(false),
        // Oracle controls
        solPrice,
        isPriceLoading,
        refreshSolPrice,
        oracleError,
      }}
    >
      {children}
    </CreditsContext.Provider>
  );
}

export function useCredits() {
  const context = useContext(CreditsContext);
  if (!context)
    throw new Error("useCredits must be used within CreditsProvider");
  return context;
}
