import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { buyerWallet, receiptId, transactionSignature, totalSolPaid } = body;

    if (!buyerWallet || !receiptId || !transactionSignature || totalSolPaid === undefined) {
      return NextResponse.json(
        { error: "Dados incompletos para processar a compra secundária." },
        { status: 400 }
      );
    }

    // Buscar comprador
    const buyer = await prisma.user.findUnique({
      where: { walletAddress: buyerWallet },
      include: { user_credits: true },
    });

    if (!buyer) {
      return NextResponse.json({ error: "Comprador não encontrado." }, { status: 404 });
    }

    // Buscar recibo
    const receipt = await prisma.investmentReceipt.findUnique({
      where: { id: receiptId },
      include: { asset: true },
    });

    if (!receipt) {
      return NextResponse.json({ error: "Recibo de investimento não encontrado." }, { status: 404 });
    }

    if (receipt.status !== "LISTED_FOR_SALE") {
      return NextResponse.json({ error: "Este ativo não está à venda." }, { status: 400 });
    }

    const currentBalance = buyer.credits ?? buyer.user_credits?.balance ?? 0;
    const BUY_FEE_CREDITS = 5;

    if (currentBalance < BUY_FEE_CREDITS) {
      return NextResponse.json(
        { error: "Saldo de créditos insuficiente. Você precisa de 5 Créditos Lake." },
        { status: 402 }
      );
    }

    const newBalance = currentBalance - BUY_FEE_CREDITS;

    // Executar transação atômica (Transferência de Posse)
    await prisma.$transaction(async (tx) => {
      // 1. Debitar créditos do comprador
      if (buyer.credits !== null) {
        await tx.user.update({
          where: { id: buyer.id },
          data: { credits: newBalance },
        });
      } else if (buyer.user_credits) {
        await tx.user_credits.update({
          where: { user_id: buyer.id },
          data: { balance: newBalance },
        });
      }

      // 2. Transferir posse e resetar status
      await tx.investmentReceipt.update({
        where: { id: receiptId },
        data: { 
          investorWallet: buyerWallet,
          status: "HELD",
          resalePrice: null, // Resetar preço
          amountPaidCrypto: new Prisma.Decimal(totalSolPaid), // Atualiza o preço histórico para o novo dono
          txHash: transactionSignature // Atualiza o lastro para a tx da compra P2P
        },
      });

      // 3. Inserir no ledger de créditos
      await tx.credit_ledger.create({
        data: {
          user_id: buyer.id,
          operation_type: "INVESTMENT_FEE",
          amount: -BUY_FEE_CREDITS,
          balance_before: currentBalance,
          balance_after: newBalance,
          crypto_amount: new Prisma.Decimal(totalSolPaid),
          crypto_symbol: "SOL",
          tx_hash: transactionSignature,
          description: `Compra Secundária P2P do recibo: ${receiptId}`,
        },
      });
    });

    return NextResponse.json(
      { success: true, message: "Ativo adquirido com sucesso no mercado secundário." },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("[POST /api/invest/secondary-buy] Erro:", error);
    return NextResponse.json(
      { error: "Erro interno ao processar a compra secundária." },
      { status: 500 }
    );
  }
}
