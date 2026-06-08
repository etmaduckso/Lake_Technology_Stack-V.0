import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isValidSolanaAddress } from "@/lib/solana-address";

export const dynamic = "force-dynamic";

// DELETE /api/assets/[id] — Exclusão segura: apenas o dono pode excluir
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Next.js 15+: params é uma Promise e deve ser aguardado
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const requestWallet = searchParams.get("wallet");

    if (!id) {
      return NextResponse.json(
        { error: "ID do ativo não fornecido." },
        { status: 400 }
      );
    }

    if (!isValidSolanaAddress(requestWallet)) {
      return NextResponse.json(
        { error: "Carteira inválida." },
        { status: 400 }
      );
    }

    const asset = await prisma.asset.findUnique({
      where: { id },
    });

    if (!asset) {
      return NextResponse.json(
        { error: "Ativo não encontrado." },
        { status: 404 }
      );
    }

    // Comparação EXATA Base58 — sem mode: insensitive, sem toLowerCase()
    if (asset.ownerWallet !== requestWallet) {
      return NextResponse.json(
        { error: "Não autorizado. Apenas o criador pode excluir este ativo." },
        { status: 403 }
      );
    }

    await prisma.asset.delete({ where: { id } });

    return NextResponse.json({
      success: true,
      message: "Ativo excluído com sucesso.",
    });
  } catch (error) {
    console.error("[DELETE /api/assets/[id]] Erro:", error);
    return NextResponse.json(
      { error: "Erro ao excluir ativo." },
      { status: 500 }
    );
  }
}

// PATCH /api/assets/[id] — Atualizar status do ativo (ex: aprovar)
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const requestWallet = searchParams.get("wallet");
    const body = await req.json();
    const { 
      status, description, isListed, contractUrl, imageUrl,
      name, valuation, tokenPrice, totalTokens, treasuryTokens, royalties 
    } = body;

    if (!id) {
      return NextResponse.json(
        { error: "ID do ativo não fornecido." },
        { status: 400 }
      );
    }

    if (!isValidSolanaAddress(requestWallet)) {
      return NextResponse.json(
        { error: "Carteira inválida." },
        { status: 400 }
      );
    }

    const asset = await prisma.asset.findUnique({
      where: { id },
    });

    if (!asset) {
      return NextResponse.json(
        { error: "Ativo não encontrado." },
        { status: 404 }
      );
    }

    if (asset.ownerWallet !== requestWallet) {
      return NextResponse.json(
        {
          error: "Não autorizado. Apenas o criador pode atualizar este ativo.",
        },
        { status: 403 }
      );
    }

    const isAttemptingTokenomicsUpdate = 
      valuation !== undefined || tokenPrice !== undefined || 
      totalTokens !== undefined || treasuryTokens !== undefined || 
      royalties !== undefined;

    if (isAttemptingTokenomicsUpdate && asset.status !== "DRAFT") {
      return NextResponse.json(
        {
          error: "Não autorizado. As variáveis de tokenomics (Valuation, Preço, Emissão, Tesouraria e Royalties) não podem ser alteradas em um ativo que não esteja no status DRAFT.",
        },
        { status: 403 }
      );
    }

    const updateData: any = {};
    if (status !== undefined) updateData.status = status;
    if (description !== undefined) updateData.description = description;
    if (isListed !== undefined) updateData.isListed = isListed;
    if (contractUrl !== undefined) updateData.contractUrl = contractUrl;
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
    if (name !== undefined) updateData.name = name;
    if (valuation !== undefined) updateData.valuation = valuation.toString();
    if (tokenPrice !== undefined) updateData.tokenPrice = tokenPrice.toString();
    if (totalTokens !== undefined) updateData.totalTokens = totalTokens;
    if (treasuryTokens !== undefined) updateData.treasuryTokens = treasuryTokens;
    if (royalties !== undefined) updateData.royalties = royalties;

    const updatedAsset = await prisma.asset.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, asset: updatedAsset });
  } catch (error) {
    console.error("[PATCH /api/assets/[id]] Erro:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar ativo." },
      { status: 500 }
    );
  }
}

// GET /api/assets/[id] — Retorna detalhes de um ativo específico para o dashboard de gestão
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "ID do ativo não fornecido." },
        { status: 400 }
      );
    }

    const asset = await prisma.asset.findUnique({
      where: { id },
    });

    if (!asset) {
      return NextResponse.json(
        { error: "Ativo não encontrado." },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    const aggregate = await prisma.investmentReceipt.aggregate({
      where: { assetId: id, status: { not: "LISTED_FOR_SALE" } },
      _sum: { quantity: true, amountPaidCrypto: true },
    });

    const tokensSold = aggregate._sum.quantity || 0;
    const revenueRaised = aggregate._sum.amountPaidCrypto ? Number(aggregate._sum.amountPaidCrypto) : 0;
    const royaltiesGenerated = 0; // Placeholder

    const [receipts, totalReceipts] = await Promise.all([
      prisma.investmentReceipt.findMany({
        where: { assetId: id, status: { not: "LISTED_FOR_SALE" } },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.investmentReceipt.count({
        where: { assetId: id, status: { not: "LISTED_FOR_SALE" } },
      }),
    ]);

    const ledger = receipts.map((r) => ({
      id: r.id,
      date: r.createdAt.toISOString(),
      quantity: r.quantity,
      value: Number(r.amountPaidCrypto),
      hash: r.txHash,
      status: r.status,
    }));

    return NextResponse.json({ 
      success: true, 
      asset,
      financials: {
        tokensSold,
        revenueRaised,
        royaltiesGenerated,
        ledger,
        pagination: {
          page,
          limit,
          total: totalReceipts,
          totalPages: Math.ceil(totalReceipts / limit),
        }
      }
    });
  } catch (error) {
    console.error("[GET /api/assets/[id]] Erro:", error);
    return NextResponse.json(
      { error: "Erro ao buscar detalhes do ativo." },
      { status: 500 }
    );
  }
}
