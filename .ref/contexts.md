# Catálogo de Contextos Globais (Gerenciadores de Estado)

Este índice descreve os contextos globais de gerenciamento de estado e fluxo de dados ativos na aplicação.

---

## 1. NetworkContext
*   **Nome:** `NetworkContext` / `useNetworkHub`
*   **Caminho:** [context/NetworkContext.tsx](file:///c:/Users/User/Documents/Lake_Technology_Stack_DOCs/Lake_Technology_Stack/context/NetworkContext.tsx)
*   **Função:** Motor de Roteamento Multi-Network (Devnet e Mainnet). Gerencia o tier de acesso do usuário (`VISITOR` vs `CITIZEN`), a preferência de rede (`userNetworkPreference`), e deriva de forma reativa os endpoints RPC Solana, Irys Nodes e a taxa de cunhagem de identidade.
*   **Como importar:**
    ```typescript
    import { useNetworkHub } from "@/context/NetworkContext";
    ```
*   **Propriedades Expostas:**
    *   `currentTier`: `'VISITOR' | 'CITIZEN'`
    *   `isDevModeOverride`: `boolean`
    *   `userNetworkPreference`: `'MAINNET' | 'DEVNET'`
    *   `solanaRpcUrl`: `string`
    *   `irysNodeUrl`: `string`
    *   `sbtMintFee`: `number`
    *   `isMainnet`: `boolean`
    *   `setTier(tier)`: `(tier: NetworkTier) => void`
    *   `setDevModeOverride(active)`: `(active: boolean) => void`
    *   `toggleNetworkPreference()`: `() => void`

---

## 2. WalletContext (Custom Wrapper)
*   **Nome:** `WalletContext` / `useWallet`
*   **Caminho:** [context/wallet-context.tsx](file:///c:/Users/User/Documents/Lake_Technology_Stack_DOCs/Lake_Technology_Stack/context/wallet-context.tsx)
*   **Função:** Provedor e validador de sessão de carteiras Solana. Interceta conexões, realiza handshakes automáticos de validação no banco (`/api/users/validate`), e **executa hidratação passiva de perfil Arweave** no momento da conexão: busca `sbtImageUrl` do banco → faz `fetch()` para a URI do Arweave → popula `setTier()` e `setSbtIdentity()` do `NetworkContext`. Ao desconectar, limpa a identidade da sessão.
*   **Como importar:**
    ```typescript
    import { useWallet } from "@/context/wallet-context";
    ```
*   **Propriedades Expostas:**
    *   `walletAddress`: `string | null`
    *   `connectWallet`: `() => void`
    *   `disconnectWallet`: `() => void`
    *   `isConnected`: `boolean`
    *   `walletType`: `string | null`
    *   `validationError`: `string | null`
*   **Responsabilidades Internas (não expostas, mas críticas):**
    *   Consome `setTier()` e `setSbtIdentity()` do `NetworkContext` para hidratar sessão.
    *   Pipeline de conexão: `validate → profile GET → Arweave fetch → setTier/setSbtIdentity`.

---

## 3. CreditsContext (Tokenomics)
*   **Nome:** `CreditsContext` / `useCredits`
*   **Caminho:** [context/credits-context.tsx](file:///c:/Users/User/Documents/Lake_Technology_Stack_DOCs/Lake_Technology_Stack/context/credits-context.tsx)
*   **Função:** Gerenciador do motor de créditos $LKZ. Sincroniza o saldo com o PostgreSQL, processa a compra de pacotes de créditos on-chain com verificação de teto (faucet limit de 300 em Devnet), debita créditos para operações pagas, e mantém o histórico de transações locais em cache.
*   **Como importar:**
    ```typescript
    import { useCredits } from "@/context/credits-context";
    ```
*   **Propriedades Expostas:**
    *   `credits`: `number`
    *   `faucetCreditsPurchased`: `number`
    *   `buyCredits(plan)`: `(plan: CreditPlan) => Promise<boolean>`
    *   `spendCredit(amount?)`: `(amount?: number) => Promise<boolean>` — **default: 3 créditos**
    *   `isLoading`: `boolean`
    *   `history`: `TransactionRecord[]`
    *   `isHistoryOpen`: `boolean`
    *   `openHistory`: `() => void`
    *   `closeHistory`: `() => void`
    *   `isModalOpen`: `boolean`
    *   `openModal`: `() => void`
    *   `closeModal`: `() => void`
    *   `solPrice`: `number | null`
    *   `refreshSolPrice`: `() => Promise<number>`
*   **Tabela de custos por operação ($LKZ):**

    | Operação | Constante | Custo |
    |---|---|---|
    | Editar Perfil Provisório (Rede Simulada) | `EDIT_LKZ_COST` | **10 $LKZ** |
    | Upgrade para Cidadão (Rede Principal) | `UPGRADE_LKZ_COST` | **5 $LKZ** |
    | Simulação de Tokenização | *(padrão `spendCredit()`)* | **3 $LKZ** |

---

## 4. MedalsContext (Gamificação)
*   **Nome:** `MedalsContext` / `useMedals`
*   **Caminho:** [context/medals-context.tsx](file:///c:/Users/User/Documents/Lake_Technology_Stack_DOCs/Lake_Technology_Stack/context/medals-context.tsx)
*   **Função:** Gerencia a trilha gamificada de medalhas e recompensas da Lake. Sincroniza conquistas do usuário, valida desbloqueios de medalhas e fornece status em tempo real para a trilha.
*   **Como importar:**
    ```typescript
    import { useMedals } from "@/context/medals-context";
    ```
*   **Propriedades Expostas:**
    *   `earned`: `string[]` (IDs das medalhas conquistadas)
    *   `earnedCount`: `number`
    *   `isEarned(medalId)`: `(id: string) => boolean`
    *   `earn(medalId)`: `(id: string) => Promise<boolean>`
