"use client";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * LakeTokeniza — NetworkContext (Motor de Roteamento Multi-Network)
 * Arquivo:  context/NetworkContext.tsx
 * Fase:     1 de 3  —  Criação do estado invisível
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * RESPONSABILIDADE
 * ─────────────────
 * Centraliza toda a lógica de qual rede (Devnet / Mainnet) deve ser usada
 * em cada momento da sessão do usuário, baseando-se no tier de acesso
 * (VISITOR vs CITIZEN) e no flag de override do Master Admin.
 *
 * ARQUITETURA DUAL-TIER
 * ─────────────────────
 *   VISITOR  → Solana Devnet + Irys Devnet (gratuito, identidade provisória)
 *   CITIZEN  → Solana Mainnet + Irys Mainnet (SBT permanente on-chain)
 *
 * FLUXO DE INTEGRAÇÃO (Fase 2 e 3)
 * ──────────────────────────────────
 *   Fase 2: Injetar `NetworkProvider` no layout global (app/layout.tsx)
 *           e substituir os RPC endpoints hardcoded dos Adapters pelo
 *           `solanaRpcUrl` derivado deste contexto.
 *   Fase 3: Conectar `setTier('CITIZEN')` ao fluxo de pagamento do SBT
 *           ($1 USDC) e persistir o tier em UserProfile.isCitizen (banco).
 *
 * REGRA DE SEGURANÇA (Master Admin Override)
 * ───────────────────────────────────────────
 *   `isDevModeOverride = true` força a rede para Devnet MESMO que o tier
 *   seja CITIZEN. Isso permite que o Master Admin teste fluxos de Cidadão
 *   em ambiente seguro sem custo real de gas ou risco de Mainnet.
 *   Esta flag NUNCA deve ser exposta na UI de usuário final.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

// ─── Constantes de Rede ───────────────────────────────────────────────────────

/** RPC público da Solana Devnet (sem custo, dados efêmeros) */
const RPC_DEVNET = "https://api.devnet.solana.com";

/**
 * RPC da Solana Mainnet.
 * Em produção, substituir por endpoint privado (Helius, QuickNode, Triton)
 * para evitar rate limiting do endpoint público.
 * Configurável via variável de ambiente para não expor chaves no código.
 */
const RPC_MAINNET =
  process.env.NEXT_PUBLIC_SOLANA_MAINNET_RPC ?? "https://api.mainnet-beta.solana.com";

/** Nó Irys (Bundlr) para Devnet — uploads expiram em ~60 dias, sem custo */
const IRYS_DEVNET = "https://devnet.irys.xyz";

/**
 * Nó Irys para Mainnet — uploads são PERMANENTES.
 * Custo irrisório (frações de centavo) subsidiado pela plataforma.
 * Usado para avatares/SBTs mesmo quando o usuário ainda é VISITOR,
 * garantindo que a imagem nunca seja perdida na migração para CITIZEN.
 */
const IRYS_MAINNET = "https://node1.irys.xyz";

/** Taxa de cunhagem do SBT de Cidadão Oficial (em USD) */
const SBT_MINT_FEE_USD = 1;

/** Taxa para VISITOR: zero (acesso gratuito via Devnet) */
const SBT_MINT_FEE_FREE = 0;

// ─── Tipos ────────────────────────────────────────────────────────────────────

/**
 * Tier de acesso do usuário no ecossistema Lake.
 *
 *   'VISITOR'  — Cadastro gratuito via Solana Devnet.
 *                Dados persistidos no banco Lake (PostgreSQL).
 *                Identidade provisória: sem SBT on-chain permanente.
 *
 *   'CITIZEN'  — SBT cunhado na Solana Mainnet (custo: $1 USDC).
 *                Identidade permanente e soberana on-chain.
 *                Desbloqueia funcionalidades exclusivas do ecossistema.
 */
export type NetworkTier = "VISITOR" | "CITIZEN";

/**
 * Shape completo do contexto de rede exposto pelo `useNetworkHub`.
 *
 * Propriedades computadas (`solanaRpcUrl`, `irysNodeUrl`, `sbtMintFee`)
 * são derivadas de `currentTier` + `isDevModeOverride` e recalculadas
 * automaticamente via `useMemo` — sem estados adicionais.
 */
export interface NetworkContextShape {
  // ── Estado primitivo ─────────────────────────────────────────────────────

  /**
   * Tier atual do usuário.
   * Default: 'VISITOR'.
   * Persistido em UserProfile.isCitizen após pagamento do SBT (Fase 3).
   */
  currentTier: NetworkTier;

  /**
   * Flag de override exclusivo do Master Admin.
   * Quando `true`, força todas as operações para Devnet independente do tier.
   * Default: `false`.
   * NUNCA expor esta flag na UI pública.
   */
  isDevModeOverride: boolean;

  // ── Propriedades derivadas (somente leitura) ─────────────────────────────

  /**
   * URL do endpoint RPC Solana derivado do tier atual.
   *
   * Lógica:
   *   CITIZEN + !isDevModeOverride → RPC_MAINNET
   *   VISITOR | isDevModeOverride  → RPC_DEVNET
   */
  solanaRpcUrl: string;

  /**
   * URL do nó Irys (Bundlr/Arweave) derivado do tier atual.
   *
   * Lógica:
   *   CITIZEN + !isDevModeOverride → IRYS_MAINNET (permanente)
   *   VISITOR | isDevModeOverride  → IRYS_DEVNET  (efêmero, gratuito)
   */
  irysNodeUrl: string;

  /**
   * Taxa de cunhagem do SBT em USD.
   *   CITIZEN → $1
   *   VISITOR → $0
   */
  sbtMintFee: number;

  /**
   * Indica se o contexto está operando na Mainnet real.
   * Conveniência para guards de segurança na UI ("Você está na Mainnet!").
   */
  isMainnet: boolean;

  // ── Métodos de mutação ───────────────────────────────────────────────────

  /**
   * Atualiza o tier do usuário.
   * Deve ser chamado pelo fluxo de pagamento do SBT (Fase 3).
   *
   * @param tier - 'VISITOR' | 'CITIZEN'
   */
  setTier: (tier: NetworkTier) => void;

  /**
   * Ativa ou desativa o modo override de desenvolvimento.
   * Exclusivo para uso do Master Admin.
   *
   * @param active - `true` para forçar Devnet, `false` para restaurar comportamento normal
   */
  setDevModeOverride: (active: boolean) => void;

  /**
   * Preferência de rede escolhida pelo usuário.
   * Default: 'DEVNET' para VISITOR, 'MAINNET' para CITIZEN.
   */
  userNetworkPreference: "MAINNET" | "DEVNET";

  /**
   * Alterna a preferência de rede entre Mainnet e Devnet.
   * Apenas para usuários com tier 'CITIZEN'.
   */
  toggleNetworkPreference: () => void;

  /**
   * Nickname do SBT de Cidadão de sessão.
   */
  sbtNickname: string | null;

  /**
   * URL permanente do avatar SBT de Cidadão no Arweave.
   */
  sbtAvatarUrl: string | null;

  /**
   * Seta a identidade digital de sessão do usuário.
   */
  setSbtIdentity: (nickname: string, avatarUrl: string) => void;
}

// ─── Contexto ─────────────────────────────────────────────────────────────────

const NetworkContext = createContext<NetworkContextShape | undefined>(undefined);

NetworkContext.displayName = "NetworkContext";

// ─── Provider ─────────────────────────────────────────────────────────────────

/**
 * Provedor do Motor de Roteamento Multi-Network.
 *
 * Envolve a aplicação (ou sub-árvore) e expõe o estado de rede via
 * `useNetworkHub`. Deve ser injetado no `app/layout.tsx` na Fase 2,
 * imediatamente abaixo dos adapters Solana.
 *
 * @example
 * // app/layout.tsx (Fase 2)
 * <WalletProvider>
 *   <NetworkProvider>
 *     {children}
 *   </NetworkProvider>
 * </WalletProvider>
 */
export function NetworkProvider({ children }: { children: ReactNode }) {
  // ── Estado primitivo ─────────────────────────────────────────────────────
  const [currentTier, setCurrentTierState] = useState<NetworkTier>("VISITOR");
  const [isDevModeOverride, setDevModeOverrideState] = useState<boolean>(false);
  const [userNetworkPreference, setUserNetworkPreference] = useState<"MAINNET" | "DEVNET">("DEVNET");

  // Hydrate from localStorage safely post-mount (avoids SSR hydration mismatches)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("lake_network_preference");
      if (saved === "MAINNET" || saved === "DEVNET") {
        setUserNetworkPreference(saved);
      }
    }
  }, []);

  // Metadados de sessão da identidade do Cidadão
  const [sbtNickname, setSbtNickname] = useState<string | null>(null);
  const [sbtAvatarUrl, setSbtAvatarUrl] = useState<string | null>(null);

  // ── Métodos de mutação (estáveis via useCallback) ────────────────────────

  /**
   * Define o tier do usuário.
   * Chame com 'CITIZEN' após confirmação on-chain do pagamento do SBT.
   */
  const setTier = useCallback((tier: NetworkTier): void => {
    setCurrentTierState(tier);
    // Respect existing localStorage choice if available
    let initialPref: "MAINNET" | "DEVNET" = tier === "CITIZEN" ? "MAINNET" : "DEVNET";
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("lake_network_preference");
      if (saved === "MAINNET" || saved === "DEVNET") {
        initialPref = saved;
      }
    }
    setUserNetworkPreference(initialPref);
    console.log(`[NetworkContext] Tier atualizado: ${tier}`);
  }, []);

  /**
   * Ativa/desativa o modo override de desenvolvimento (Master Admin only).
   * Quando ativo, força Devnet mesmo que o tier seja CITIZEN.
   */
  const setDevModeOverride = useCallback((active: boolean): void => {
    setDevModeOverrideState(active);
    console.log(
      `[NetworkContext] DevMode Override: ${active ? "ATIVADO (forçando Devnet)" : "DESATIVADO"}`
    );
  }, []);

  /**
   * Alterna a preferência de rede do usuário.
   */
  const toggleNetworkPreference = useCallback((): void => {
    setUserNetworkPreference((prev) => {
      const nextPref = prev === "MAINNET" ? "DEVNET" : "MAINNET";
      if (typeof window !== "undefined") {
        localStorage.setItem("lake_network_preference", nextPref);
      }
      console.log(`[NetworkContext] Preferência de rede alterada para: ${nextPref}`);
      return nextPref;
    });
  }, []);

  /**
   * Define os metadados de sessão da identidade do Cidadão.
   */
  const setSbtIdentity = useCallback((nickname: string, avatarUrl: string): void => {
    setSbtNickname(nickname);
    setSbtAvatarUrl(avatarUrl);
    console.log(`[NetworkContext] Identidade de Cidadão salva na sessão: Nickname=${nickname}`);
  }, []);

  // ── Propriedades derivadas (recalculadas apenas quando estado muda) ───────

  /**
   * `true` quando o usuário é CITIZEN E o admin não forçou Devnet.
   * Ponto único de verdade para todo roteamento de rede.
   */
  const isCitizenOnMainnet = useMemo(
    () => currentTier === "CITIZEN" && !isDevModeOverride && userNetworkPreference === "MAINNET",
    [currentTier, isDevModeOverride, userNetworkPreference]
  );

  const solanaRpcUrl = useMemo(
    () => (isCitizenOnMainnet ? RPC_MAINNET : RPC_DEVNET),
    [isCitizenOnMainnet]
  );

  const irysNodeUrl = useMemo(
    () => (isCitizenOnMainnet ? IRYS_MAINNET : IRYS_DEVNET),
    [isCitizenOnMainnet]
  );

  const sbtMintFee = useMemo(
    () => (currentTier === "CITIZEN" ? SBT_MINT_FEE_USD : SBT_MINT_FEE_FREE),
    [currentTier]
  );

  // ── Valor do contexto (memoizado para evitar re-renders desnecessários) ───

  const contextValue = useMemo<NetworkContextShape>(
    () => ({
      // Estado primitivo
      currentTier,
      isDevModeOverride,
      userNetworkPreference,
      sbtNickname,
      sbtAvatarUrl,

      // Propriedades derivadas (somente leitura)
      solanaRpcUrl,
      irysNodeUrl,
      sbtMintFee,
      isMainnet: isCitizenOnMainnet,

      // Métodos de mutação
      setTier,
      setDevModeOverride,
      toggleNetworkPreference,
      setSbtIdentity,
    }),
    [
      currentTier,
      isDevModeOverride,
      userNetworkPreference,
      sbtNickname,
      sbtAvatarUrl,
      solanaRpcUrl,
      irysNodeUrl,
      sbtMintFee,
      isCitizenOnMainnet,
      setTier,
      setDevModeOverride,
      toggleNetworkPreference,
      setSbtIdentity,
    ]
  );

  return (
    <NetworkContext.Provider value={contextValue}>
      {children}
    </NetworkContext.Provider>
  );
}

// ─── Hook de Consumo ──────────────────────────────────────────────────────────

/**
 * Hook para consumir o Motor de Roteamento Multi-Network.
 *
 * Lança erro explícito se usado fora do `NetworkProvider`, evitando
 * falhas silenciosas de undefined context.
 *
 * @returns {NetworkContextShape} Estado e métodos do contexto de rede
 *
 * @example
 * // Em qualquer componente filho do NetworkProvider:
 * const { solanaRpcUrl, currentTier, isMainnet, setTier } = useNetworkHub();
 *
 * // Guard de Mainnet na UI:
 * if (isMainnet) {
 *   // Exibir aviso "Você está operando na Mainnet. Transações são reais."
 * }
 *
 * // Upgrade de tier após pagamento do SBT (Fase 3):
 * await mintCitizenSbt(); // confirma on-chain
 * setTier('CITIZEN');    // atualiza o roteamento de rede globalmente
 */
export function useNetworkHub(): NetworkContextShape {
  const context = useContext(NetworkContext);

  if (context === undefined) {
    throw new Error(
      "[useNetworkHub] Hook utilizado fora do NetworkProvider.\n" +
        "Envolva o componente pai com <NetworkProvider> para corrigir."
    );
  }

  return context;
}

// ─── Export padrão do Provider (facilita import no layout) ───────────────────

export default NetworkProvider;
