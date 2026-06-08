import { NextResponse } from "next/server";
import { Connection, PublicKey, SystemProgram, Transaction, sendAndConfirmTransaction } from "@solana/web3.js";
import { getBotKeypair } from "@/lib/solana-bot";
import { isValidSolanaAddress } from "@/lib/solana-address";

// Limite de tempo básico para rate-limit (cooldown de 5 minutos)
const FAUCET_COOLDOWN_MS = 5 * 60 * 1000;
const rateLimitMap = new Map<string, number>();

// Controle de cota de uso máximo por carteira (Limite 1 resgate único).
// Obs: Map in-memory é reiniciado em restart; o frontend usa a medalha
// fase-3-faucet como fallback persistente via /api/medals.
export const faucetUsageCountMap = new Map<string, number>();
export const FAUCET_MAX_CLAIMS = 1; // tokenomics guard: 1 resgate por carteira

// GET /api/faucet?wallet=... — verifica se a carteira já resgatou
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const wallet = searchParams.get("wallet");

  if (!wallet || !isValidSolanaAddress(wallet)) {
    return NextResponse.json({ error: "Carteira inválida." }, { status: 400 });
  }

  const count = faucetUsageCountMap.get(wallet) ?? 0;
  const alreadyClaimed = count >= FAUCET_MAX_CLAIMS;

  return NextResponse.json({
    wallet,
    claimCount: count,
    alreadyClaimed,
    remainingClaims: Math.max(0, FAUCET_MAX_CLAIMS - count),
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { walletAddress } = body;

    // 1. Validações Iniciais
    if (!walletAddress) {
      return NextResponse.json(
        { error: "Endereço da carteira não informado." },
        { status: 400 }
      );
    }

    if (!isValidSolanaAddress(walletAddress)) {
      return NextResponse.json(
        { error: "Endereço de carteira Solana inválido." },
        { status: 400 }
      );
    }

    // 2. Validação da Cota Máxima de Uso (Máximo 1 resgate por carteira — Tokenomics Guard)
    const currentUsageCount = faucetUsageCountMap.get(walletAddress) || 0;
    if (currentUsageCount >= FAUCET_MAX_CLAIMS) {
      return NextResponse.json(
        { 
          error: "Acesso negado. Esta carteira já resgatou seus 0.05 SOL de teste. Cada carteira tem direito a 1 resgate único.",
          alreadyClaimed: true,
        },
        { status: 403 }
      );
    }

    // 3. Aplicação de Rate-Limit por Carteira (Cooldown)
    const now = Date.now();
    const lastRequest = rateLimitMap.get(walletAddress);
    if (lastRequest && now - lastRequest < FAUCET_COOLDOWN_MS) {
      const remainingSeconds = Math.ceil((FAUCET_COOLDOWN_MS - (now - lastRequest)) / 1000);
      return NextResponse.json(
        { 
          error: `Rate-limit atingido. Por favor, aguarde ${remainingSeconds} segundos antes de solicitar novamente.` 
        },
        { status: 429 }
      );
    }

    // 4. Inicialização do Bot de Tesouraria e Conexão RPC
    let botKeypair;
    try {
      botKeypair = getBotKeypair();
    } catch (botError: any) {
      console.error("[Faucet API] Chave da Tesouraria ausente ou malformada:", botError);
      return NextResponse.json(
        { 
          error: "O Bot de Tesouraria não está configurado ou inicializado. Configure WALLET_TREASURY_PRIVATE_KEY no arquivo de ambiente (.env.local)." 
        },
        { status: 503 }
      );
    }

    const rpcUrl = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://api.devnet.solana.com";
    const connection = new Connection(rpcUrl, "confirmed");

    // 5. Verificação de Saldo do Próprio Faucet (Reduzido para 0.05 SOL)
    const botBalance = await connection.getBalance(botKeypair.publicKey);
    const amountToTransfer = 0.05 * 1_000_000_000; // Reduzido para 0.05 SOL em lamports

    if (botBalance < amountToTransfer) {
      return NextResponse.json(
        { 
          error: `A carteira da tesouraria está sem saldo suficiente (${(botBalance / 1_000_000_000).toFixed(4)} SOL). Recarregue a carteira do bot: ${botKeypair.publicKey.toBase58()}` 
        },
        { status: 503 }
      );
    }

    // 6. Construção e Envio da Transação
    const recipientPubkey = new PublicKey(walletAddress);
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: botKeypair.publicKey,
        toPubkey: recipientPubkey,
        lamports: amountToTransfer,
      })
    );

    console.log(`[LakeFaucet] Solicitando 0.05 SOL para ${walletAddress}...`);
    const signature = await sendAndConfirmTransaction(connection, transaction, [botKeypair]);
    console.log(`[LakeFaucet] Sucesso! TX ID: ${signature}`);

    // Incrementa os contadores de uso e salva timestamps
    faucetUsageCountMap.set(walletAddress, currentUsageCount + 1);
    rateLimitMap.set(walletAddress, now);

    return NextResponse.json({
      success: true,
      signature,
      amount: 0.05,
      recipient: walletAddress,
      alreadyClaimed: false,
      remainingClaims: 0, // após este resgate, zerou
    }, { status: 200 });

  } catch (error: any) {
    console.error("[Faucet API Error]", error);
    return NextResponse.json(
      { error: `Falha ao processar transferência do Faucet: ${error?.message || error}` },
      { status: 500 }
    );
  }
}
