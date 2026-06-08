# Catálogo de Serviços e Utilitários de Integração

Este índice descreve as integrações com serviços externos, APIs, SDKs e utilitários utilitários de blockchain e storage.

---

## 1. Arweave Uploader (Irys Integration)
*   **Nome:** `uploadImageToArweave`
*   **Caminho:** [lib/arweave-uploader.ts](file:///c:/Users/User/Documents/Lake_Technology_Stack_DOCs/Lake_Technology_Stack/lib/arweave-uploader.ts)
*   **Função:** Centraliza os uploads de arquivos permanentes no Arweave via Irys Network (antiga Bundlr). Contém a configuração de nó Mainnet para garantir a permanência e metadados on-chain.
*   **Como importar:**
    ```typescript
    import { uploadImageToArweave } from "@/lib/arweave-uploader";
    ```
*   **Métodos Expostos:**
    *   `uploadImageToArweave(fileBuffer, options)`: `Promise<ArweaveUploadResult>` (Server-side)
    *   `buildArweaveUrl(txId)`: `(txId: string) => string` (Conversão para gateway HTTP)
    *   `isArweaveUrl(url)`: `(url: string | null) => boolean` (Validador de URL permanente)

---

## 2. Server Irys Storage Service
*   **Nome:** `uploadFileToIrys`
*   **Caminho:** [lib/storage/irys.ts](file:///c:/Users/User/Documents/Lake_Technology_Stack_DOCs/Lake_Technology_Stack/lib/storage/irys.ts)
*   **Função:** Serviço backend executado no servidor que consome a chave privada e inicializa o SDK do Irys para fazer uploads reais de arquivos na blockchain.
*   **Como importar:**
    ```typescript
    import { uploadFileToIrys } from "@/lib/storage/irys";
    ```
*   **Métodos Expostos:**
    *   `uploadFileToIrys(fileBuffer, contentType)`: `Promise<{ url: string }>`

---

## 3. Solana Connection Adapter
*   **Nome:** `SolanaConnectionAdapter`
*   **Caminho:** [components/SolanaConnectionAdapter.tsx](file:///c:/Users/User/Documents/Lake_Technology_Stack_DOCs/Lake_Technology_Stack/components/SolanaConnectionAdapter.tsx)
*   **Função:** Componente wrapper que consome dinamicamente o `solanaRpcUrl` do `NetworkContext` e inicializa o provedor de conexões RPC da Solana (`ConnectionProvider`), evitando conexões estáticas hardcoded.
*   **Como importar:**
    ```typescript
    import { SolanaConnectionAdapter } from "@/components/SolanaConnectionAdapter";
    ```

---

## 4. UI Toasts (Sonner Toaster)
*   **Nome:** `Toaster` / `toast`
*   **Caminho:** Configurado globalmente em [layout.tsx](file:///c:/Users/User/Documents/Lake_Technology_Stack_DOCs/Lake_Technology_Stack/app/layout.tsx#L70).
*   **Função:** Biblioteca `sonner` para envio de notificações premium ricas (toasts) no lado do cliente.
*   **Como importar:**
    ```typescript
    import { toast } from "sonner";
    ```
*   **Métodos Comuns:**
    *   `toast.success(message)`
    *   `toast.error(message)`
    *   `toast.info(message)`
    *   `toast(message, { action, cancel })` (toasts interativos com botões de callback)

---

## 5. IdentityMetadataService
*   **Nome:** `buildAndUploadIdentity` / `uploadAvatarToArweave` / `uploadIdentityMetadataToArweave`
*   **Caminho:** [lib/identity-metadata.ts](file:///c:/Users/User/Documents/Lake_Technology_Stack_DOCs/Lake_Technology_Stack/lib/identity-metadata.ts)
*   **Função:** Centraliza o pipeline de empacotamento e upload de metadados de identidade Lake ao Arweave via `/api/upload`. Elimina duplicação (DRY) entre `handleEditProfileSave` (Rede Simulada) e `handleUpgradeConfirm` (Rede Principal). Garante que o banco de dados (Supabase) receba **apenas** a URI soberana do JSON do Arweave, nunca dados brutos.
*   **Como importar:**
    ```typescript
    import { buildAndUploadIdentity } from "@/lib/identity-metadata";
    ```
*   **Métodos Expostos:**
    *   `uploadAvatarToArweave(imageFile, walletAddress, txSignature, cryptoAmount?)`: `Promise<string>` — URL do avatar no Arweave
    *   `uploadIdentityMetadataToArweave(nickname, avatarUrl, walletAddress, txSignature, cryptoAmount?)`: `Promise<string>` — URI soberana do JSON
    *   `buildAndUploadIdentity(nickname, imageFile, existingAvatarUrl, walletAddress, imageTxSig, metaTxSig, cryptoAmount?)`: `Promise<{ metadataUrl, avatarUrl }>` — Pipeline completo
*   **Regra de Soberania de Dados:**
    > O banco **NUNCA** armazena `nickname` ou `avatarUrl` diretamente. Armazena apenas a URI do JSON hospedado no Arweave (`sbtImageUrl`).
