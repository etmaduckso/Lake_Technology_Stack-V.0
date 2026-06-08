"use client";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * LakeTokeniza — SolanaConnectionAdapter
 * Arquivo:  components/SolanaConnectionAdapter.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * RESPONSABILIDADE (Fase 2 da Arquitetura Multi-Network)
 * ───────────────────────────────────────────────────────
 * Lê o `solanaRpcUrl` do NetworkContext e re-instancia o `ConnectionProvider`
 * da Solana com o endpoint correto (Devnet ou Mainnet) de forma dinâmica.
 *
 * POR QUE UM COMPONENTE SEPARADO?
 * ──────────────────────────────────
 * O `ConnectionProvider` precisa do endpoint *antes* de renderizar filhos.
 * O `NetworkProvider` precisa estar *acima* do `ConnectionProvider` na árvore
 * para fornecer o URL via context. Portanto, o fluxo é:
 *
 *   NetworkProvider              ← define qual rede usar
 *     └── SolanaProvider         ← configura wallets (sem Connection ainda)
 *           └── SolanaConnectionAdapter  ← lê NetworkContext, inicia Connection
 *                 └── {children}         ← o resto da aplicação
 *
 * QUANDO O ENDPOINT MUDA?
 * ────────────────────────
 * Quando o usuário faz upgrade de VISITOR → CITIZEN (Fase 3), o NetworkContext
 * atualiza `solanaRpcUrl` → este componente re-renderiza com o novo endpoint →
 * o `ConnectionProvider` cria uma nova conexão apontando para a Mainnet.
 * Toda a aplicação abaixo recebe a conexão correta automaticamente.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useMemo } from "react";
import { ConnectionProvider } from "@solana/wallet-adapter-react";
import { useNetworkHub } from "@/context/NetworkContext";

interface SolanaConnectionAdapterProps {
  children: React.ReactNode;
}

/**
 * Wrapper fino que conecta o NetworkContext ao ConnectionProvider da Solana.
 * Deve ser filho direto do SolanaProvider e pai de todo o restante da árvore.
 */
export function SolanaConnectionAdapter({ children }: SolanaConnectionAdapterProps) {
  const { solanaRpcUrl, currentTier, isMainnet } = useNetworkHub();

  /**
   * Memoizamos o endpoint para que o ConnectionProvider não receba um novo
   * objeto de referência em cada render (evita re-conexões desnecessárias).
   * A dependência em `solanaRpcUrl` garante reconexão quando o tier muda.
   */
  const endpoint = useMemo(() => solanaRpcUrl, [solanaRpcUrl]);

  if (process.env.NODE_ENV !== "production") {
    // Log de desenvolvimento para rastrear qual rede está ativa
    console.log(
      `[SolanaConnectionAdapter] Tier: ${currentTier} | ` +
      `Rede: ${isMainnet ? "MAINNET ⚠️" : "Devnet ✅"} | ` +
      `RPC: ${endpoint}`
    );
  }

  return (
    <ConnectionProvider endpoint={endpoint}>
      {children}
    </ConnectionProvider>
  );
}
