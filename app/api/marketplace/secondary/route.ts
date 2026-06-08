import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const receipts = await prisma.investmentReceipt.findMany({
      where: { status: "LISTED_FOR_SALE" },
      include: { asset: true, investor: true },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json({ receipts }, { status: 200 });
  } catch (error: any) {
    console.error("[GET /api/marketplace/secondary] Erro:", error);
    return NextResponse.json({ error: "Erro ao buscar mercado secundário." }, { status: 500 });
  }
}
