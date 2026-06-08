/**
 * useTokenizeDraft — Persistência de rascunho do Wizard de Tokenização
 *
 * Armazena o estado do formulário em localStorage para que o usuário não
 * perca dados ao atualizar a página. Também persiste o hash da transação
 * de pagamento para evitar cobrança dupla em caso de retry.
 */
"use client";

import { useState, useEffect, useCallback } from "react";

// ─── Chaves de armazenamento ─────────────────────────────────────────────────

/** Rascunho dos dados do formulário (campos de texto e números) */
export const DRAFT_KEY = "lake_tokenize_draft_v1";

/** Hash da transação de pagamento da taxa de emissão ($0.50 SOL) */
export const PAYMENT_TX_KEY = "lake_tokenize_payment_tx";

// ─── Tipos ───────────────────────────────────────────────────────────────────

export interface TokenizeDraftData {
  name: string;
  sector: string;
  tokenNature: string;
  description: string;
  valuation: number;
  tokenCount: number;
  tokenPrice: number;
  treasuryTokens: number;
  royalties: number;
  /** Passo atual do wizard (1, 2 ou 3) */
  currentStep: number;
}

const DEFAULT_DRAFT: TokenizeDraftData = {
  name: "",
  sector: "",
  tokenNature: "",
  description: "",
  valuation: 0,
  tokenCount: 0,
  tokenPrice: 0,
  treasuryTokens: 0,
  royalties: 0,
  currentStep: 1,
};

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useTokenizeDraft() {
  const [draft, setDraftState] = useState<TokenizeDraftData>(DEFAULT_DRAFT);
  const [savedPaymentTx, setSavedPaymentTxState] = useState<string | null>(null);
  /** true após a primeira leitura do localStorage (evita flash de dados padrão) */
  const [isLoaded, setIsLoaded] = useState(false);

  // Carrega o rascunho do localStorage na montagem do componente
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<TokenizeDraftData>;
        setDraftState({ ...DEFAULT_DRAFT, ...parsed });
      }
      const tx = localStorage.getItem(PAYMENT_TX_KEY);
      if (tx) setSavedPaymentTxState(tx);
    } catch (e) {
      console.warn("[useTokenizeDraft] Falha ao carregar localStorage:", e);
    }
    setIsLoaded(true);
  }, []);

  /**
   * Atualiza o rascunho (state + localStorage).
   * Aceita o novo valor ou uma função de atualização (same API do useState).
   */
  const setDraft = useCallback(
    (updater: TokenizeDraftData | ((prev: TokenizeDraftData) => TokenizeDraftData)) => {
      setDraftState((prev) => {
        const next = typeof updater === "function" ? updater(prev) : updater;
        try {
          localStorage.setItem(DRAFT_KEY, JSON.stringify(next));
        } catch (e) {
          console.warn("[useTokenizeDraft] Falha ao salvar localStorage:", e);
        }
        return next;
      });
    },
    []
  );

  /**
   * Persiste o hash da transação de pagamento.
   * Chamado após confirmação da tx de $0.50 SOL para a Tesouraria.
   */
  const savePaymentTx = useCallback((txHash: string) => {
    setSavedPaymentTxState(txHash);
    try {
      localStorage.setItem(PAYMENT_TX_KEY, txHash);
    } catch (e) {
      console.warn("[useTokenizeDraft] Falha ao salvar paymentTx:", e);
    }
  }, []);

  /**
   * Limpa o rascunho e a transação do localStorage.
   * Chamado após emissão bem-sucedida do ativo.
   */
  const clearDraft = useCallback(() => {
    setDraftState(DEFAULT_DRAFT);
    setSavedPaymentTxState(null);
    try {
      localStorage.removeItem(DRAFT_KEY);
      localStorage.removeItem(PAYMENT_TX_KEY);
    } catch (e) {
      console.warn("[useTokenizeDraft] Falha ao limpar localStorage:", e);
    }
  }, []);

  return {
    draft,
    setDraft,
    savedPaymentTx,
    savePaymentTx,
    clearDraft,
    isLoaded,
  };
}
