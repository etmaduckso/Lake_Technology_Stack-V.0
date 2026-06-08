import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { receiptId, walletAddress } = body;

    if (!receiptId || !walletAddress) {
      return NextResponse.json({ error: "Dados incompletos." }, { status: 400 });
    }

    const receipt = await prisma.investmentReceipt.findUnique({
      where: { id: receiptId },
    });

    if (!receipt) {
      return NextResponse.json({ error: "Recibo não encontrado." }, { status: 404 });
    }

    if (receipt.investorWallet !== walletAddress) {
      return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
    }

    if (receipt.status !== "LISTED_FOR_SALE") {
      return NextResponse.json({ error: "Este lote não está à venda." }, { status: 400 });
    }

    // Reverter status e limpar preço de revenda
    await prisma.investmentReceipt.update({
      where: { id: receiptId },
      data: {
        status: "HELD",
        resalePrice: null,
      },
    });

    return NextResponse.json({ success: true, message: "Listagem cancelada." }, { status: 200 });
  } catch (error: any) {
    console.error("[POST /api/invest/cancel-resale] Erro:", error);
    return NextResponse.json({ error: "Erro interno ao cancelar a venda." }, { status: 500 });
  }
}
