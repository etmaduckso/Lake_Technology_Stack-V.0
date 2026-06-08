import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const assetId = id;
    const url = new URL(req.url);
    const wallet = url.searchParams.get("wallet");
    const body = await req.json();

    if (!wallet) {
      return NextResponse.json({ error: "Wallet não informada." }, { status: 400 });
    }

    if (body.isListed === undefined) {
      return NextResponse.json({ error: "isListed não informado no body." }, { status: 400 });
    }

    // Buscar o ativo
    const asset = await prisma.asset.findUnique({
      where: { id: assetId },
    });

    if (!asset) {
      return NextResponse.json({ error: "Ativo não encontrado." }, { status: 404 });
    }

    // Verificar se o usuário é o dono
    if (asset.ownerWallet !== wallet) {
      return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
    }

    // Atualizar no banco
    const updatedAsset = await prisma.asset.update({
      where: { id: assetId },
      data: { isListed: body.isListed },
    });

    return NextResponse.json({ success: true, asset: updatedAsset });
  } catch (error: any) {
    console.error("[PATCH /api/assets/[id]/list]", error);
    return NextResponse.json({ error: "Erro interno no servidor." }, { status: 500 });
  }
}
