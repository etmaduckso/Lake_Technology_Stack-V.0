/**
 * IdentityMetadataService — @/lib/identity-metadata.ts
 *
 * Centraliza a criação e o upload do pacote de metadados de identidade Lake
 * ao Arweave via Irys Web SDK (100% Client-Side / Não-Custodial).
 *
 * REGRA DE SOBERANIA DE DADOS:
 *   - O banco (Supabase/PostgreSQL) NUNCA armazena nickname ou avatarUrl diretamente.
 *   - O banco armazena APENAS a URI do JSON hospedado permanentemente no Arweave.
 *   - Esta função produz essa URI, que é o único dado persistido no banco.
 *
 * Ref: .ref/services.md → IdentityMetadataService
 */

export interface IdentityMetadata {
  nickname: string;
  avatarUrl: string;
}

export interface UploadIdentityResult {
  /** URL permanente do JSON de metadados no Arweave (URI soberana) */
  metadataUrl: string;
  /** URL permanente da imagem do avatar no Arweave */
  avatarUrl: string;
}

/**
 * Aguarda o balance ser indexado pelo nó Irys.
 */
async function waitForIrysBalance(irys: any, requiredPrice: any, maxRetries = 6): Promise<boolean> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const balance = await irys.getLoadedBalance();
      if (balance.gte(requiredPrice)) {
        console.log(`[Irys Client] Balance indexado com sucesso: ${balance.toString()} >= ${requiredPrice.toString()}`);
        return true;
      }
      console.log(`[Irys Client] Aguardando indexação do balance (${i + 1}/${maxRetries})...`);
    } catch (e) {
      console.warn("[Irys Client] Erro ao checar balance:", e);
    }
    // Aguarda 1.5 segundos antes da próxima verificação
    await new Promise((resolve) => setTimeout(resolve, 1500));
  }
  return false;
}

/**
 * Faz upload de um File de imagem ao Arweave via Irys Web SDK.
 *
 * @param imageFile  - Arquivo de imagem selecionado pelo usuário
 * @param walletAddress - Endereço da carteira Solana (Base58)
 * @param irys - Instância do Irys WebUploader
 * @returns URL permanente da imagem no Arweave
 */
export async function uploadAvatarToArweave(
  imageFile: File,
  walletAddress: string,
  irys: any
): Promise<string> {
  const { Buffer: BrowserBuffer } = await import("buffer");
  const imgBuffer = BrowserBuffer.from(await imageFile.arrayBuffer());

  // Top-up no Irys se necessário (aguarda indexação do split tx primeiro)
  try {
    const price = await irys.getPrice(imgBuffer.length);
    const balanceOk = await waitForIrysBalance(irys, price);
    if (!balanceOk) {
      console.warn("[Irys Client] Balance ainda insuficiente para o avatar após espera. Tentando fundar diretamente...");
      await irys.fund(price.multipliedBy(1.2).integerValue());
    }
  } catch (fundErr) {
    console.warn("[Irys Client] Erro de balance/funding do avatar:", fundErr);
  }

  const imgReceipt = await irys.upload(imgBuffer, {
    tags: [
      { name: "Content-Type", value: imageFile.type || "image/jpeg" },
      { name: "App-Name", value: "LakeTokeniza" },
      { name: "User-Wallet", value: walletAddress },
      { name: "Upload-Purpose", value: "avatar" },
    ],
  });
  return `https://gateway.irys.xyz/${imgReceipt.id}`;
}

/**
 * Empacota e faz upload do JSON de metadados de identidade ao Arweave via Irys Web SDK.
 *
 * @param nickname  - Nickname escolhido pelo usuário
 * @param avatarUrl - URL permanente do avatar (após upload pela uploadAvatarToArweave)
 * @param walletAddress - Endereço da carteira Solana (Base58)
 * @param irys - Instância do Irys WebUploader
 * @returns URL permanente do JSON de metadados no Arweave (URI soberana)
 */
export async function uploadIdentityMetadataToArweave(
  nickname: string,
  avatarUrl: string,
  walletAddress: string,
  irys: any
): Promise<string> {
  const { Buffer: BrowserBuffer } = await import("buffer");
  const payload: IdentityMetadata = { nickname: nickname.trim(), avatarUrl };
  const jsonStr = JSON.stringify(payload, null, 2);
  const jsonBuffer = BrowserBuffer.from(jsonStr);

  // Top-up no Irys se necessário (aguarda indexação do split tx primeiro)
  try {
    const price = await irys.getPrice(jsonBuffer.length);
    const balanceOk = await waitForIrysBalance(irys, price);
    if (!balanceOk) {
      console.warn("[Irys Client] Balance ainda insuficiente para os metadados após espera. Tentando fundar diretamente...");
      await irys.fund(price.multipliedBy(1.2).integerValue());
    }
  } catch (fundErr) {
    console.warn("[Irys Client] Erro de balance/funding dos metadados:", fundErr);
  }

  const jsonReceipt = await irys.upload(jsonBuffer, {
    tags: [
      { name: "Content-Type", value: "application/json" },
      { name: "App-Name", value: "LakeTokeniza" },
      { name: "User-Wallet", value: walletAddress },
      { name: "Upload-Purpose", value: "metadata" },
    ],
  });

  return `https://gateway.irys.xyz/${jsonReceipt.id}`;
}

/**
 * Pipeline completo client-side: faz upload do avatar (se fornecido) e do JSON de metadados.
 * Retorna a URI soberana do JSON e a URL do avatar.
 *
 * @param nickname  - Nickname escolhido
 * @param imageFile - File de imagem novo (ou null para manter a URL já existente)
 * @param existingAvatarUrl - URL atual do avatar (usada quando imageFile = null)
 * @param walletAddress - Endereço da carteira (Base58)
 * @param irysProvider - Provedor de carteira (Phantom) para assinar transações
 * @param irysNodeUrl - Endpoint do nó Irys a utilizar
 * @returns { metadataUrl, avatarUrl }
 */
export async function buildAndUploadIdentity(
  nickname: string,
  imageFile: File | null,
  existingAvatarUrl: string,
  walletAddress: string,
  irysProvider: any,
  irysNodeUrl: string = "https://devnet.irys.xyz"
): Promise<UploadIdentityResult> {
  // Importação dinâmica para evitar que componentes SSR quebrem no build do Next.js
  const { WebUploader } = await import("@irys/web-upload");
  const { WebSolana }   = await import("@irys/web-upload-solana");

  const rpcUrl = irysNodeUrl.includes("devnet")
    ? "https://api.devnet.solana.com"
    : (process.env.NEXT_PUBLIC_SOLANA_RPC_URL ?? "https://api.mainnet-beta.solana.com");

  console.log(`[Irys Client] Inicializando uploader para o nó: ${irysNodeUrl}`);

  const uploaderPromise = (async () => {
    return await WebUploader(WebSolana)
      .withProvider(irysProvider)
      .withRpc(rpcUrl)
      .bundlerUrl(irysNodeUrl);
  })();

  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error("Timeout: A carteira não respondeu em 30 segundos.")), 30000)
  );

  const irys: any = await Promise.race([uploaderPromise, timeoutPromise]);

  let finalAvatarUrl = existingAvatarUrl;

  // Upload de nova imagem somente se o usuário selecionou um arquivo
  if (imageFile) {
    finalAvatarUrl = await uploadAvatarToArweave(
      imageFile,
      walletAddress,
      irys
    );
  }

  // Sempre sobe o JSON atualizado com os dados mais recentes
  const metadataUrl = await uploadIdentityMetadataToArweave(
    nickname,
    finalAvatarUrl,
    walletAddress,
    irys
  );

  return { metadataUrl, avatarUrl: finalAvatarUrl };
}

