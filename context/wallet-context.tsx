"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useCallback,
  ReactNode,
  useState,
} from "react";
import { useWallet as useSolanaWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { useRouter } from "next/navigation";
import { useNetworkHub } from "@/context/NetworkContext";

interface WalletContextType {
  walletAddress: string | null;
  connectWallet: () => void;
  disconnectWallet: () => void;
  isConnected: boolean;
  walletType: string | null;
  validationError: string | null;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  const { publicKey, connected, disconnect, wallet, connect, connecting } =
    useSolanaWallet();
  const { setVisible } = useWalletModal();
  const [validationError, setValidationError] = useState<string | null>(null);
  const router = useRouter();

  const walletAddress = publicKey ? publicKey.toBase58() : null;
  const walletType = wallet?.adapter.name || null;

  // DPO/LGPD Compliance: Trigger connection handshakes strictly when a wallet has been explicitly selected from the modal
  useEffect(() => {
    if (wallet && !connected && !connecting) {
      const walletName = wallet.adapter.name;
      console.log("[Handshake Trace] Iniciando conexão com:", walletName);
      console.log(
        `🔌 [Wallet Context] Estabelecendo handshake de conexão com a carteira: ${walletName}...`
      );
      connect().catch((err) => {
        console.error("❌ Falha ao estabelecer handshake com a carteira:", err);
        setValidationError(
          "Não foi possível concluir a conexão com a carteira."
        );
      });
    }
  }, [wallet, connected, connecting, connect]);

  const { setTier, setSbtIdentity } = useNetworkHub();

  useEffect(() => {
    // Quando conecta a carteira Solana, validamos no banco e hidratamos o perfil
    const validateAndHydrateUser = async () => {
      if (connected && walletAddress) {
        try {
          console.log("🔍 Validando usuário no banco de dados Solana...");
          const response = await fetch("/api/users/validate", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ walletAddress }),
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || "Falha na validação do usuário");
          }

          console.log("✅ Usuário validado no banco de dados:", data.user);
          setValidationError(null);

          // Hidratação passiva de perfil a partir do banco e do Arweave
          console.log("🔍 Carregando perfil do usuário...");
          const profileRes = await fetch(`/api/users/profile?wallet=${walletAddress}`);
          if (profileRes.ok) {
            const profileData = await profileRes.json();
            if (profileData.success) {
              // Seta o tier com base no status de cidadão do banco de dados
              if (profileData.isCitizen) {
                setTier("CITIZEN");
              } else {
                setTier("VISITOR");
              }

              // Se houver a URI/HASH do JSON no Arweave, buscamos as informações
              if (profileData.sbtImageUrl) {
                try {
                  console.log(`🌐 Buscando metadados do Arweave: ${profileData.sbtImageUrl}`);
                  const arweaveRes = await fetch(profileData.sbtImageUrl);
                  if (arweaveRes.ok) {
                    const arweaveData = await arweaveRes.json();
                    if (arweaveData.nickname) {
                      setSbtIdentity(arweaveData.nickname, arweaveData.avatarUrl || "");
                    }
                  }
                } catch (arweaveErr) {
                  console.error("❌ Erro ao buscar dados do Arweave:", arweaveErr);
                }
              } else {
                setSbtIdentity("", "");
              }
            }
          }
        } catch (dbError) {
          console.error("❌ Erro ao validar/hidratar usuário no banco:", dbError);
          setValidationError(
            "Carteira conectada. Não foi possível sincronizar seu perfil agora."
          );
        }
      } else {
        setValidationError(null);
        // Limpa a identidade da sessão ao desconectar
        setSbtIdentity("", "");
        setTier("VISITOR");
      }
    };

    validateAndHydrateUser();
  }, [connected, walletAddress, setTier, setSbtIdentity]);

  // NOTA: router.refresh() foi removido intencionalmente.
  // O React Context já propaga mudanças de 'connected'/'walletAddress'
  // reativamente para todos os consumidores sem necessidade de revalidar
  // o cache do servidor. O refresh() causava desmount/remount da árvore
  // de componentes, quebrando a reatividade dos Client Components.

  const connectWallet = useCallback(() => {
    setValidationError(null);
    setVisible(true); // Abre o modal do Solana Wallet Adapter
  }, [setVisible]);

  const disconnectWallet = useCallback(() => {
    setValidationError(null);
    disconnect().finally(() => {
      // Limpeza forçada de cache de sessão e wallet local
      localStorage.removeItem("walletName");
      sessionStorage.clear();
      router.refresh();
    });
  }, [disconnect, router]);

  return (
    <WalletContext.Provider
      value={{
        walletAddress,
        connectWallet,
        disconnectWallet,
        isConnected: connected,
        walletType,
        validationError,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
}
