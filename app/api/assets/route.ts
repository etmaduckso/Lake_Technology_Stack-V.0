import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  getDatabaseUnavailablePayload,
  isDatabaseConfigured,
} from "@/lib/database-status";
import { isValidSolanaAddress } from "@/lib/solana-address";

export const dynamic = "force-dynamic";

// GET /api/assets — Lista todos os ativos aprovados + os do usuário (via query param)
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const wallet = searchParams.get("wallet");

  try {
    if (wallet && !isValidSolanaAddress(wallet)) {
      return NextResponse.json(
        { error: "Carteira inválida." },
        { status: 400 }
      );
    }

    if (!isDatabaseConfigured()) {
      return NextResponse.json({
        assets: [],
        ...getDatabaseUnavailablePayload(),
      });
    }

    const where = wallet
      ? { OR: [{ status: { in: ["APPROVED" as const, "TOKENIZED" as const] } }, { ownerWallet: wallet }] }
      : { status: { in: ["APPROVED" as const, "TOKENIZED" as const] } };

    const assets = await prisma.asset.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ assets });
  } catch (error) {
    console.error("[GET /api/assets] Erro:", error);
    return NextResponse.json(
      { error: "Erro ao buscar ativos." },
      { status: 500 }
    );
  }
}

// POST /api/assets — Cria novo ativo simulado vinculado à carteira do criador
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      ownerWallet,
      name,
      description,
      type,
      valuation,
      tokenPrice,
      totalTokens,
      sector,
      tokenNature,
      treasuryTokens,
      marketTokens,
      royalties,
      imageUrl,
      contractUrl,
    } = body;

    if (!isValidSolanaAddress(ownerWallet)) {
      return NextResponse.json(
        { error: "Carteira inválida." },
        { status: 400 }
      );
    }

    if (!name || !type || !valuation || !tokenPrice || !totalTokens) {
      return NextResponse.json(
        { error: "Campos obrigatórios ausentes." },
        { status: 400 }
      );
    }

    if (!isDatabaseConfigured()) {
      return NextResponse.json(
        {
          asset: {
            id: `local-${Date.now()}`,
            ownerWallet,
            name,
            type,
            valuation,
            tokenPrice,
            totalTokens,
            sector: sector || null,
            tokenNature: tokenNature || null,
            treasuryTokens: treasuryTokens ? Number(treasuryTokens) : 0,
            marketTokens: marketTokens ? Number(marketTokens) : 0,
            tokensAvailable: marketTokens ? Number(marketTokens) : 0,
            royalties: royalties ? parseFloat(royalties) : 0.0,
            description: description || null,
            imageUrl: imageUrl || null,
            contractUrl: contractUrl || null,
            status: "APPROVED",
          },
          ...getDatabaseUnavailablePayload(),
        },
        { status: 201 }
      );
    }

    // Garante que o usuário existe no banco antes de criar o ativo
    await prisma.user.upsert({
      where: { walletAddress: ownerWallet },
      update: {},
      create: { walletAddress: ownerWallet, credits: 0 },
    });

    const asset = await prisma.asset.create({
      data: {
        ownerWallet,
        name,
        type,
        valuation: Number(valuation),
        tokenPrice: Number(tokenPrice),
        totalTokens: Number(totalTokens),
        sector: sector || null,
        tokenNature: tokenNature || null,
        treasuryTokens: treasuryTokens ? Number(treasuryTokens) : 0,
        marketTokens: marketTokens ? Number(marketTokens) : 0,
        tokensAvailable: marketTokens ? Number(marketTokens) : 0,
        royalties: royalties ? parseFloat(royalties) : 0.0,
        description: description || null,
        imageUrl: imageUrl || null,
        contractUrl: contractUrl || null,
        status: "APPROVED",
        isListed: true,
      },
    });

    return NextResponse.json({ asset }, { status: 201 });
  } catch (error: any) {
    console.error("[Prisma Create Error]", error);
    return NextResponse.json(
      { error: `Erro ao criar ativo: ${error?.message || error}` },
      { status: 500 }
    );
  }
}
