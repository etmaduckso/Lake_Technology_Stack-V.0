import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isValidSolanaAddress } from "@/lib/solana-address";
import {
  getDatabaseUnavailablePayload,
  isDatabaseConfigured,
} from "@/lib/database-status";
import { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

// GET: Buscar créditos do usuário
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const walletAddress = searchParams.get("wallet");

    if (!isValidSolanaAddress(walletAddress)) {
      return NextResponse.json(
        { error: "walletAddress inválido" },
        { status: 400 }
      );
    }

    if (!isDatabaseConfigured()) {
      return NextResponse.json({
        credits: 5,
        walletAddress,
        ...getDatabaseUnavailablePayload(),
      });
    }

    const user = await prisma.user.findUnique({
      where: { walletAddress: walletAddress },
      select: { credits: true, walletAddress: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      credits: user.credits,
      walletAddress: user.walletAddress,
    });
  } catch (error: any) {
    console.error("Erro ao buscar créditos:", error);
    return NextResponse.json(
      { error: "Erro ao buscar créditos", details: error.message },
      { status: 500 }
    );
  }
}

// POST: Gastar créditos
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { walletAddress, amount = 1, description, txHash, solAmount } = body;

    if (!isValidSolanaAddress(walletAddress)) {
      return NextResponse.json(
        { error: "walletAddress inválido" },
        { status: 400 }
      );
    }

    if (!isDatabaseConfigured()) {
      return NextResponse.json({
        success: true,
        credits: Math.max(0, 5 - Number(amount || 1)),
        spent: amount,
        ...getDatabaseUnavailablePayload(),
      });
    }

    // Buscar usuário atual
    const user = await prisma.user.findUnique({
      where: { walletAddress: walletAddress },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    // Verificar se tem créditos suficientes
    if (user.credits < amount) {
      return NextResponse.json(
        { error: "Créditos insuficientes", credits: user.credits },
        { status: 400 }
      );
    }

    // Decrementar créditos
    const updatedUser = await prisma.user.update({
      where: { walletAddress: walletAddress },
      data: { credits: { decrement: amount } },
    });

    // Registrar no audit log
    await prisma.auditLog.create({
      data: {
        actorWallet: walletAddress,
        actionType: "SPEND_CREDITS",
        targetId: "CREDIT_SPEND",
        details: JSON.stringify({
          amount,
          previousBalance: user.credits,
          newBalance: updatedUser.credits,
          txHash,
          solAmount,
        }),
      },
    });

    // Registrar no credit_ledger
    await prisma.credit_ledger.create({
      data: {
        user_id: user.id,
        operation_type: "USAGE",
        amount: -amount,
        balance_before: user.credits,
        balance_after: updatedUser.credits,
        crypto_amount: solAmount ? new Prisma.Decimal(solAmount) : null,
        crypto_symbol: solAmount ? "SOL" : null,
        tx_hash: txHash || null,
        description: description || "Gasto de créditos",
      },
    });

    console.log(
      `✅ Créditos gastos: ${amount}. Saldo restante: ${updatedUser.credits}`
    );

    return NextResponse.json({
      success: true,
      credits: updatedUser.credits,
      spent: amount,
    });
  } catch (error: any) {
    console.error("Erro ao gastar créditos:", error);
    return NextResponse.json(
      { error: "Erro ao processar transação", details: error.message },
      { status: 500 }
    );
  }
}

// PATCH: Adicionar créditos (compra)
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { walletAddress, amount = 10, planId, txHash } = body;

    if (!isValidSolanaAddress(walletAddress)) {
      return NextResponse.json(
        { error: "walletAddress inválido" },
        { status: 400 }
      );
    }

    if (!isDatabaseConfigured()) {
      return NextResponse.json({
        success: true,
        credits: Number(amount || 10),
        added: amount,
        planId,
        ...getDatabaseUnavailablePayload(),
      });
    }

    // Buscar saldo anterior para o audit log
    const previousUser = await prisma.user.findUnique({
      where: { walletAddress: walletAddress },
      select: { credits: true },
    });

    const previousBalance = previousUser?.credits || 0;

    // Incrementar créditos
    const updatedUser = await prisma.user.update({
      where: { walletAddress: walletAddress },
      data: { credits: { increment: amount } },
    });

    // Registrar no audit log (BUY_CREDITS)
    await prisma.auditLog.create({
      data: {
        actorWallet: walletAddress,
        actionType: "BUY_CREDITS",
        targetId: "CREDIT_BUY",
        details: JSON.stringify({
          planId: planId || "unknown",
          credits: amount,
          txHash: txHash || null,
          previousBalance,
          newBalance: updatedUser.credits,
        }),
      },
    });

    console.log(
      `✅ Créditos adicionados: ${amount}. Plano: ${planId}. Novo saldo: ${updatedUser.credits}`
    );

    return NextResponse.json({
      success: true,
      credits: updatedUser.credits,
      added: amount,
      planId,
    });
  } catch (error: any) {
    console.error("Erro ao adicionar créditos:", error);
    return NextResponse.json(
      { error: "Erro ao adicionar créditos", details: error.message },
      { status: 500 }
    );
  }
}
