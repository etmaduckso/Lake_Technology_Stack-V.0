# Catálogo de Hooks Customizados Globais

Este índice descreve os hooks customizados globais ativos na aplicação.

---

## 1. useAdmin
*   **Nome:** `useAdmin`
*   **Caminho:** [hooks/useAdmin.ts](file:///c:/Users/User/Documents/Lake_Technology_Stack_DOCs/Lake_Technology_Stack/hooks/useAdmin.ts)
*   **Função:** Hook de verificação de permissões administrativas e embaixadores VIP baseando-se em uma lista de carteiras autorizadas hardcoded (mock temporário) e no endereço conectado.
*   **Como importar:**
    ```typescript
    import { useAdmin } from "@/hooks/useAdmin";
    ```
*   **Propriedades Expostas:**
    *   `isAdmin`: `boolean` (indica se a carteira tem papel VIP/Admin)
    *   `role`: `'Master' | 'Admin' | 'User'`

---

## 2. useExchangeRates
*   **Nome:** `useExchangeRates`
*   **Caminho:** [hooks/useExchangeRates.ts](file:///c:/Users/User/Documents/Lake_Technology_Stack_DOCs/Lake_Technology_Stack/hooks/useExchangeRates.ts)
*   **Função:** Provê as taxas de conversão de câmbio atualizadas (USD/BRL e SOL/USD) consumindo as APIs de oráculos e backups, aplicando buffers de segurança e cotações necessárias para precificação trilateral.
*   **Como importar:**
    ```typescript
    import { useExchangeRates } from "@/hooks/useExchangeRates";
    ```
*   **Propriedades Expostas:**
    *   `rates`: `{ usdBrl: number; solUsd: number; lastUpdated: Date }`
    *   `refreshRates`: `() => Promise<void>`
    *   `isLoading`: `boolean`

---

## 3. useRequireWallet
*   **Nome:** `useRequireWallet`
*   **Caminho:** [hooks/useRequireWallet.ts](file:///c:/Users/User/Documents/Lake_Technology_Stack_DOCs/Lake_Technology_Stack/hooks/useRequireWallet.ts)
*   **Função:** Hook interceptador de ações. Se a carteira não estiver conectada, exibe uma notificação de aviso e dispara a conexão (modal do Phantom). Caso contrário, prossegue com a ação passada via callback.
*   **Como importar:**
    ```typescript
    import { useRequireWallet } from "@/hooks/useRequireWallet";
    ```
*   **Propriedades Expostas:**
    *   `requireWallet`: `(action: () => void) => boolean` (retorna `true` se conectado e executou a ação, `false` caso contrário)
