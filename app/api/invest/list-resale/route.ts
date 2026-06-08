import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";
import crypto from "crypto";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { walletAddress, transactionSignature, cryptoAmount, receiptId, resaleQty, resalePrice } = body;

    if (!walletAddress || !transactionSignature || cryptoAmount === undefined || !receiptId || !resaleQty || !resalePrice) {
      return NextResponse.json(
        { error: "Dados incompletos para processar a listagem no mercado secundário." },
        { status: 400 }
      );
    }

    if (resaleQty <= 0 || resalePrice <= 0) {
      return NextResponse.json({ error: "Quantidade ou preço inválidos." }, { status: 400 });
    }

    // Buscar usuário
    const user = await prisma.user.findUnique({
      where: { walletAddress },
      include: { user_credits: true },
    });

    if (!user) {
      return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });
    }

    // Buscar recibo
    const receipt = await prisma.investmentReceipt.findUnique({
      where: { id: receiptId },
      include: { asset: true },
    });

    if (!receipt) {
      return NextResponse.json({ error: "Recibo de investimento não encontrado." }, { status: 404 });
    }

    if (receipt.investorWallet !== walletAddress) {
      return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
    }

    if (receipt.status !== "HELD") {
      return NextResponse.json({ error: "Este ativo já está listado ou foi vendido." }, { status: 400 });
    }

    if (resaleQty > receipt.quantity) {
      return NextResponse.json({ error: "Quantidade de listagem maior do que a possuída." }, { status: 400 });
    }

    const currentBalance = user.credits ?? user.user_credits?.balance ?? 0;
    const LISTING_FEE_CREDITS = 5;

    if (currentBalance < LISTING_FEE_CREDITS) {
      return NextResponse.json(
        { error: "Saldo de créditos insuficiente. Você precisa de 5 Créditos Lake." },
        { status: 402 }
      );
    }

    const newBalance = currentBalance - LISTING_FEE_CREDITS;

    // Executar transação atômica (Fissão)
    await prisma.$transaction(async (tx) => {
      // 1. Debitar créditos
      if (user.credits !== null) {
        await tx.user.update({
          where: { id: user.id },
          data: { credits: newBalance },
        });
      } else if (user.user_credits) {
        await tx.user_credits.update({
          where: { user_id: user.id },
          data: { balance: newBalance },
        });
      }

      // 2. Lógica de Fissão
      if (resaleQty === receipt.quantity) {
        // Venda Total
        await tx.investmentReceipt.update({
          where: { id: receiptId },
          data: { 
            status: "LISTED_FOR_SALE",
            resalePrice: new Prisma.Decimal(Number(resalePrice))
          },
        });
      } else {
        // Venda Parcial (Fissão)
        // Cálculo Proporcional (Regra de Três)
        const unitCostSol = Number(receipt.amountPaidCrypto) / receipt.quantity;
        const newReceiptCostSol = unitCostSol * resaleQty;
        const remainingCostSol = Number(receipt.amountPaidCrypto) - newReceiptCostSol;

        // Subtrair do recibo original
        await tx.investmentReceipt.update({
          where: { id: receiptId },
          data: { 
            quantity: receipt.quantity - resaleQty,
            amountPaidCrypto: new Prisma.Decimal(remainingCostSol)
          },
        });

        // Criar novo recibo listado
        const newHashString = `${receipt.assetId}-${walletAddress}-${resaleQty}-${Date.now()}-resale`;
        const childFractionHash = crypto.createHash("sha256").update(newHashString).digest("hex");

        await tx.investmentReceipt.create({
          data: {
            investorWallet: walletAddress,
            assetId: receipt.assetId,
            quantity: resaleQty,
            amountPaidCrypto: new Prisma.Decimal(newReceiptCostSol),
            cryptoSymbol: receipt.cryptoSymbol,
            txHash: transactionSignature, // Usamos a transação de listagem como lastro do novo recibo fracionado
            child_fraction_hash: childFractionHash,
            status: "LISTED_FOR_SALE",
            resalePrice: new Prisma.Decimal(Number(resalePrice))
          },
        });
      }

      // 3. Inserir no ledger de créditos
      await tx.credit_ledger.create({
        data: {
          user_id: user.id,
          operation_type: "SECONDARY_MARKET_FEE",
          amount: -LISTING_FEE_CREDITS,
          balance_before: currentBalance,
          balance_after: newBalance,
          crypto_amount: new Prisma.Decimal(cryptoAmount),
          crypto_symbol: "SOL",
          tx_hash: transactionSignature,
          description: `Listagem no Secundário (Qtd: ${resaleQty}) do recibo: ${receiptId}`,
        },
      });
    });

    return NextResponse.json(
      { success: true, message: "Ativo listado no mercado secundário com sucesso." },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("[POST /api/invest/list-resale] Erro:", error);
    return NextResponse.json(
      { error: "Erro interno ao processar a listagem." },
      { status: 500 }
    );
  }
}
