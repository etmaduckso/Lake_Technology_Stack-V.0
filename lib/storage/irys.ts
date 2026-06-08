import { Uploader } from "@irys/upload";
import { Solana } from "@irys/upload-solana";

/**
 * Instancia o Uploader real do Irys na Devnet usando a chave privada da
 * carteira de tesouraria (WALLET_TREASURY_PRIVATE_KEY).
 *
 * API Reference: https://docs.irys.xyz/build/d/sdk/upload/uploadData
 * - builder.devnet()  → configura nó: devnet.irys.xyz + RPC Solana Devnet
 * - Gateway de leitura: gateway.irys.xyz (independente de rede)
 */
async function getIrysUploader() {
  const privateKeyStr = process.env.WALLET_TREASURY_PRIVATE_KEY;

  if (!privateKeyStr) {
    throw new Error(
      "WALLET_TREASURY_PRIVATE_KEY não está configurada no arquivo .env.local."
    );
  }

  const secretKeyArray = JSON.parse(privateKeyStr) as number[];
  const secretKey = Uint8Array.from(secretKeyArray);

  // .withRpc() é OBRIGATÓRIO para o nó devnet.irys.xyz funcionar
  // .devnet() — método correto conforme builder.d.ts da versão instalada
  const uploader = await Uploader(Solana)
    .withWallet(secretKey)
    .withRpc("https://api.devnet.solana.com")
    .devnet();

  return uploader;
}

/**
 * Faz upload de um arquivo binário para o Arweave via Irys Devnet,
 * patrocinado integralmente pela carteira do Bot de Tesouraria.
 *
 * @param fileBuffer - Buffer do arquivo a ser enviado
 * @param mimeType   - MIME type do arquivo (ex: "image/png", "application/pdf")
 * @returns URL pública de leitura: https://gateway.irys.xyz/<receipt.id>
 */
export async function uploadFileToIrys(
  fileBuffer: Buffer,
  mimeType: string
): Promise<{ url: string; receiptId: string; costSOL: number }> {
  const uploader = await getIrysUploader();

  // Verifica o custo estimado e o saldo carregado antes do upload
  const uploadCost = await uploader.getPrice(fileBuffer.length);
  const loadedBalance = await uploader.getLoadedBalance();

  const costReadable = uploader.utils.fromAtomic(uploadCost);
  const balanceReadable = uploader.utils.fromAtomic(loadedBalance);

  console.log(`[Irys] Custo estimado: ${costReadable} SOL | Saldo disponível: ${balanceReadable} SOL`);

  // Ambos retornam BigInt — comparação e aritmética devem usar BigInt
  const costBig = BigInt(uploadCost.toString());
  const balanceBig = BigInt(loadedBalance.toString());

  if (balanceBig < costBig) {
    const deficit = costBig - balanceBig;
    throw new InsufficientFundsError(
      `Saldo insuficiente na tesouraria Irys. ` +
        `Necessário: ${costReadable} SOL, ` +
        `Disponível: ${balanceReadable} SOL, ` +
        `Déficit: ${uploader.utils.fromAtomic(deficit)} SOL.`
    );
  }

  // Tags obrigatórias para que o browser renderize inline (não faça download)
  const tags = [
    { name: "Content-Type", value: mimeType },
    { name: "App-Name", value: "Lake" },
  ];

  console.log(`[Irys] Iniciando upload: ${fileBuffer.length} bytes | tipo: ${mimeType}`);

  const receipt = await uploader.upload(fileBuffer, { tags });

  // gateway.irys.xyz é o gateway oficial de LEITURA (funciona em devnet e mainnet)
  const url = `https://gateway.irys.xyz/${receipt.id}`;
  const costSOL = parseFloat(costReadable.toString());

  console.log(`[Irys] Upload concluído! Receipt ID: ${receipt.id} | URL: ${url}`);

  return { url, receiptId: receipt.id, costSOL };
}

/**
 * Erro lançado quando o saldo na conta Irys é insuficiente para o upload.
 * Permite que a camada de API retorne HTTP 402 (Payment Required).
 */
export class InsufficientFundsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InsufficientFundsError";
  }
}
