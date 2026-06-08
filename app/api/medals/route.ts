import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { MEDALS, getMedal } from "@/lib/medals";

// Solana base58 (32-44 chars, sem 0/O/I/l). Permissivo o bastante.
const WALLET_REGEX = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

function isValidWallet(addr: unknown): addr is string {
  return typeof addr === "string" && WALLET_REGEX.test(addr);
}

function emptyResponse() {
  return NextResponse.json({ wallet: null, earned: [], total: MEDALS.length });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const wallet = searchParams.get("wallet");

  if (!wallet) {
    return emptyResponse();
  }
  if (!isValidWallet(wallet)) {
    return NextResponse.json({ error: "invalid wallet" }, { status: 400 });
  }

  try {
    const rows = await prisma.userMedal.findMany({
      where: { userWallet: wallet },
      orderBy: { earnedAt: "asc" },
    });
    return NextResponse.json({
      wallet,
      earned: rows.map((r) => ({
        medalId: r.medalId,
        earnedAt: r.earnedAt.toISOString(),
      })),
      total: MEDALS.length,
    });
  } catch (err) {
    // Sem DB: cliente cai no fallback localStorage.
    return NextResponse.json({
      wallet,
      earned: [],
      total: MEDALS.length,
      degraded: true,
    });
  }
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const { wallet, medalId } = (body ?? {}) as {
    wallet?: unknown;
    medalId?: unknown;
  };

  if (!isValidWallet(wallet)) {
    return NextResponse.json({ error: "invalid wallet" }, { status: 400 });
  }
  if (typeof medalId !== "string" || !getMedal(medalId)) {
    return NextResponse.json({ error: "unknown medal" }, { status: 400 });
  }

  try {
    // garante que o User existe (FK de userWallet -> users.walletAddress).
    await prisma.user.upsert({
      where: { walletAddress: wallet },
      update: {},
      create: { walletAddress: wallet },
    });
    // upsert garante idempotencia: ganhar a medalha duas vezes nao duplica.
    const row = await prisma.userMedal.upsert({
      where: { userWallet_medalId: { userWallet: wallet, medalId } },
      update: {},
      create: { userWallet: wallet, medalId },
    });
    return NextResponse.json({
      ok: true,
      medalId: row.medalId,
      earnedAt: row.earnedAt.toISOString(),
    });
  } catch (err) {
    // DB offline: cliente persiste em localStorage.
    return NextResponse.json({
      ok: true,
      medalId,
      earnedAt: new Date().toISOString(),
      degraded: true,
    });
  }
}
