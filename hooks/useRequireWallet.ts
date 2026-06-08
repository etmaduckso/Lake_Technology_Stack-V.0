"use client";

import { useWallet } from "@/context/wallet-context";
import { toast } from "sonner";

/**
 * Hook customizado para interceptar cliques e ações que exigem uma carteira conectada.
 * Se o usuário não estiver conectado, o modal de conexão é exibido e a ação é abortada.
 *
 * @returns requireWallet - Função interceptadora de ações.
 *
 * @example
 * const requireWallet = useRequireWallet();
 * ...
 * onClick={() => requireWallet(() => openModal())}
 */
export function useRequireWallet() {
  const { isConnected, connectWallet } = useWallet();

  const requireWallet = (action: () => void) => {
    if (!isConnected) {
      toast.info("Por favor, conecte sua carteira para continuar.");
      connectWallet();
      return false;
    }
    action();
    return true;
  };

  return requireWallet;
}
