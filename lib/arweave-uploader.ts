/**
 * ─────────────────────────────────────────────────────────────────────────────
 * LakeTokeniza — Arweave Uploader via Irys Network
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * PROPÓSITO
 * ---------
 * Centraliza o upload de imagens de perfil (avatar/SBT) para o Arweave via
 * Irys (antigo Bundlr Network). Toda imagem enviada pela plataforma vai para
 * a MAINNET do Arweave, mesmo que o usuário esteja operando na Solana Devnet.
 *
 * POR QUE SEMPRE MAINNET DO ARWEAVE?
 * ------------------------------------
 * O Arweave é uma camada de armazenamento permanente (paga uma vez, dura
 * para sempre). Ao guardar avatares na Mainnet:
 *
 *   1. PERMANÊNCIA SOBERANA: A imagem existe fora da infraestrutura da Lake.
 *      Mesmo que a plataforma feche, o avatar do usuário continua acessível.
 *
 *   2. CUSTO IRRISÓRIO: O custo de upload de uma imagem <500 KB é frações
 *      de centavo (estimativa: ~$0.001–0.005 por upload). A plataforma
 *      subsidia esse custo para garantir a experiência premium.
 *
 *   3. DESACOPLAMENTO DE REDE SOLANA: O Arweave não é a Solana. Um usuário
 *      em Devnet tem o mesmo direito à permanência de dados que um usuário
 *      em Mainnet. Quando o usuário fizer o upgrade para Cidadão Oficial
 *      (SBT na Mainnet Solana), a URL do avatar no Arweave já estará pronta
 *      e não precisará ser re-enviada.
 *
 * FLUXO DE UPLOAD
 * ---------------
 * 1. Usuário seleciona uma imagem no Lake ID Card (botão de câmera).
 * 2. Frontend chama POST /api/upload (rota backend).
 * 3. Rota backend usa as funções deste módulo para fazer upload via Irys.
 * 4. URL permanente do Arweave (https://arweave.net/<TX_ID>) é retornada.
 * 5. URL é salva em UserProfile.sbtImageUrl no PostgreSQL.
 * 6. Sessão global é atualizada reativamente via setSbtIdentity.
 *
 * CONFIGURAÇÃO OBRIGATÓRIA
 * ------------------------
 * Variável de ambiente (server-side only):
 *   IRYS_PRIVATE_KEY — Array JSON da chave privada Solana da conta de pagamento Lake.
 *   Exemplo: [81, 143, 20, 239, ...]
 *   NUNCA expor no cliente (NEXT_PUBLIC_*).
 *
 * ATENÇÃO
 * -------
 * Este módulo roda APENAS no servidor (API Routes / Server Actions).
 * NUNCA expor a chave privada de pagamento no lado do cliente (browser).
 * ─────────────────────────────────────────────────────────────────────────────
 */

// ─── Tipos ───────────────────────────────────────────────────────────────────

/** Resultado de um upload bem-sucedido para o Arweave via Irys */
export interface ArweaveUploadResult {
  /** ID da transação Arweave (32 bytes em Base64URL) */
  txId: string;
  /** URL permanente de acesso à imagem no Arweave Gateway público */
  permanentUrl: string;
  /** Timestamp Unix do upload (segundos) */
  uploadedAt: number;
  /** Tamanho do arquivo em bytes */
  sizeBytes: number;
}

/** Opções de upload */
export interface UploadOptions {
  /** MIME type da imagem (ex: 'image/png', 'image/webp', 'image/jpeg') */
  contentType: string;
  /** Wallet Solana do usuário — adicionada como tag para indexação on-chain */
  userWallet: string;
  /** Tipo de uso: 'avatar' = foto de perfil, 'sbt' = imagem do token SBT */
  purpose: 'avatar' | 'sbt' | 'metadata';
  /**
   * Nó Irys a usar.
   * - 'devnet'  → https://devnet.irys.xyz  (uploads expiram em ~60 dias, sem custo real)
   * - 'mainnet' → https://node1.irys.xyz   (uploads permanentes, custo irrisório em SOL)
   * Default: 'devnet' (safe fallback para não gastar SOL real em testes)
   */
  irysNode?: 'devnet' | 'mainnet';
}

// ─── Constantes ──────────────────────────────────────────────────────────────

/** Nó Irys Mainnet — uploads PERMANENTES */
export const IRYS_NODE_MAINNET = 'https://node1.irys.xyz';

/** Nó Irys Devnet — uploads efêmeros (~60 dias), sem custo real */
export const IRYS_NODE_DEVNET = 'https://devnet.irys.xyz';

/** Gateway público do Arweave para leitura de conteúdo */
export const ARWEAVE_GATEWAY = 'https://arweave.net';

/** RPC Solana Devnet para o cliente Irys (usado para estimar fees) */
const SOLANA_RPC_DEVNET = 'https://api.devnet.solana.com';

/** RPC Solana Mainnet (pode ser substituído por endpoint privado via env) */
const SOLANA_RPC_MAINNET =
  process.env.NEXT_PUBLIC_SOLANA_RPC_URL ?? 'https://api.mainnet-beta.solana.com';

// ─── Utilitários ─────────────────────────────────────────────────────────────

/**
 * Constrói a URL permanente de leitura a partir de um Transaction ID Arweave.
 *
 * @param txId - ID da transação Arweave (retornado pelo Irys após upload)
 * @returns URL pública permanente (ex: 'https://arweave.net/abc123...')
 */
export function buildArweaveUrl(txId: string): string {
  return `${ARWEAVE_GATEWAY}/${txId}`;
}

/**
 * Verifica se uma URL é um endereço válido do Arweave Gateway.
 *
 * @param url - URL a verificar
 * @returns true se a URL aponta para o gateway do Arweave
 */
export function isArweaveUrl(url: string | null): boolean {
  if (!url) return false;
  return url.startsWith(ARWEAVE_GATEWAY) || url.startsWith('https://arweave.net/');
}

// ─── Serviço de Upload (Server-Side Only) ────────────────────────────────────

/**
 * Faz upload de um buffer de imagem (ou JSON) para o Arweave via Irys.
 *
 * ⚠️  ATENÇÃO: Esta função deve ser chamada EXCLUSIVAMENTE em rotas de API
 *     Next.js (app/api/**) ou Server Actions. NUNCA no lado do cliente.
 *
 * Pré-requisitos:
 *   - Variável de ambiente: IRYS_PRIVATE_KEY (array JSON da chave Solana da
 *     conta de pagamento Lake — subsidiada pela plataforma).
 *   - Dependência: @irys/upload-solana (já instalada no package.json)
 *
 * @param fileBuffer  - Buffer do arquivo a ser enviado (imagem ou JSON)
 * @param options     - Opções de upload (contentType, userWallet, purpose, irysNode)
 * @returns           - Resultado do upload com txId e URL permanente
 *
 *
 * TODO: Implementar quando o endpoint POST /api/upload/avatar for criado.
 *       Descomentar o código abaixo e instalar '@irys/sdk'.
 */
export async function uploadImageToArweave(
  fileBuffer: Buffer,
  options: UploadOptions,
): Promise<ArweaveUploadResult> {
  // ── 1. Validação da chave de pagamento (server-side guard) ─────────────────
  const irysPrivateKeyStr = process.env.IRYS_PRIVATE_KEY;
  if (!irysPrivateKeyStr) {
    throw new Error(
      '[ArweaveUploader] IRYS_PRIVATE_KEY não configurada. ' +
      'Adicione ao .env.local o array JSON da chave privada Solana da conta de pagamento Lake. ' +
      'NUNCA use NEXT_PUBLIC_ para este segredo.',
    );
  }

  // ── 2. Parse e validação da chave privada ──────────────────────────────────
  let secretKeyArray: number[];
  try {
    secretKeyArray = JSON.parse(irysPrivateKeyStr);
    if (!Array.isArray(secretKeyArray) || secretKeyArray.length !== 64) {
      throw new Error('Esperado array JSON de exatamente 64 números (32 bytes × 2).');
    }
  } catch (parseError: any) {
    throw new Error(
      `[ArweaveUploader] Falha ao parsear IRYS_PRIVATE_KEY: ${parseError.message}`,
    );
  }

  // ── 3. Selecionar nó Irys e RPC com base no tier do usuário ───────────────
  const useMainnet = options.irysNode === 'mainnet';
  const irysNodeUrl  = useMainnet ? IRYS_NODE_MAINNET : IRYS_NODE_DEVNET;
  const rpcUrl       = useMainnet
    ? (process.env.NEXT_PUBLIC_SOLANA_RPC_URL ?? 'https://api.mainnet-beta.solana.com')
    : 'https://api.devnet.solana.com';

  console.log(
    `[ArweaveUploader] Iniciando upload | Nó: ${irysNodeUrl} | ` +
    `Tipo: ${options.purpose} | Wallet: ${options.userWallet.slice(0, 8)}...`,
  );

  // ── 4. Inicializar cliente Irys via @irys/upload-solana ───────────────────
  // Importação dinâmica evita que o bundle do cliente carregue módulos Node.js.
  // API: Uploader(Token).withWallet(key).devnet() ou .bundlerUrl(url)
  const { Uploader } = await import('@irys/upload');
  const { SolanaToken } = await import('@irys/upload-solana');

  // Converte o array de bytes para Buffer (formato aceito pelo SDK como privateKey)
  const secretKeyBuffer = Buffer.from(Uint8Array.from(secretKeyArray));

  // Selecionar o nó com base no tier do usuário (devnet = grátis, mainnet = permanente)
  let irysBuilder = Uploader(SolanaToken).withWallet(secretKeyBuffer);

  if (useMainnet) {
    // Mainnet: uploads permanentes, paga gas em SOL real
    irysBuilder = irysBuilder.bundlerUrl(IRYS_NODE_MAINNET).withRpc(rpcUrl);
  } else {
    // Devnet: uploads efêmeros (~60 dias), sem custo real — ideal para VISITOR
    irysBuilder = irysBuilder.devnet();
  }

  const irys = await irysBuilder;

  // ── 5. Tags de indexação Arweave (rastreabilidade por carteira e propósito) ─
  const tags = [
    { name: 'Content-Type',   value: options.contentType },
    { name: 'App-Name',       value: 'LakeTokeniza' },
    { name: 'App-Version',    value: '1.1.0' },
    { name: 'User-Wallet',    value: options.userWallet },
    { name: 'Upload-Purpose', value: options.purpose },
    { name: 'Uploaded-At',    value: new Date().toISOString() },
    { name: 'Network-Tier',   value: useMainnet ? 'mainnet' : 'devnet' },
  ];

  // ── 6. Upload efetivo ──────────────────────────────────────────────────────
  const receipt = await irys.upload(fileBuffer, { tags });

  const txId        = receipt.id;
  const permanentUrl = buildArweaveUrl(txId);

  console.log(
    `[ArweaveUploader] ✅ Upload concluído! TX: ${txId} | URL: ${permanentUrl} | ` +
    `Bytes: ${fileBuffer.byteLength}`,
  );

  return {
    txId,
    permanentUrl,
    uploadedAt: Math.floor(Date.now() / 1000),
    sizeBytes:  fileBuffer.byteLength,
  };
}
