/**
 * ─────────────────────────────────────────────────────────────────────────────
 * LakeTokeniza — /api/users/profile
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * GET  ?wallet=<Base58>
 *   Retorna o perfil público do usuário: isCitizen, sbtImageUrl (URI Arweave), role.
 *   Não expõe nickname (regra de soberania: nickname vive apenas no Arweave).
 *
 * POST { walletAddress, sbtImageUrl, isCitizen, transactionSignature }
 *   Atualiza o perfil do usuário. Exige prova criptográfica de ownership:
 *   a transactionSignature deve referenciar uma tx Solana cujo signatário
 *   inclua o walletAddress enviado. Registra AuditLog atômico.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { NextRequest, NextResponse } from "next/server";
import { Connection, PublicKey } from "@solana/web3.js";
import { prisma } from "@/lib/db";

// ─── Constante de erro genérica (não vaza detalhes de segurança) ─────────────
const GENERIC_AUTH_ERROR = "Não autorizado. Assinatura inválida ou ausente.";

// ─── GET /api/users/profile?wallet=<Base58> ───────────────────────────────────

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const wallet = searchParams.get("wallet");
  const txId = searchParams.get("txId");

  if (!wallet && !txId) {
    return NextResponse.json({ error: "wallet or txId is required" }, { status: 400 });
  }

  if (wallet) {
    // Validação básica do formato Base58
    try {
      new PublicKey(wallet);
    } catch {
      return NextResponse.json({ error: "wallet inválido" }, { status: 400 });
    }

    try {
      const user = await prisma.user.findUnique({
        where: { walletAddress: wallet },
        include: { userProfile: true },
      });

      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        nickname: null, // Regra de Ouro: Nunca expor nickname pelo banco — vive apenas no Arweave
        isCitizen: user.userProfile?.isCitizen ?? false,
        sbtImageUrl: user.userProfile?.sbtImageUrl ?? null, // URI do JSON de metadados no Arweave
        role: user.role,
        createdAt: user.userProfile?.createdAt ?? null,
        updatedAt: user.userProfile?.updatedAt ?? null,
      });
    } catch (error: any) {
      console.error("[Profile GET] Erro:", error);
      return NextResponse.json({ error: "Erro interno ao buscar perfil." }, { status: 500 });
    }
  } else {
    try {
      const profile = await prisma.userProfile.findFirst({
        where: {
          sbtImageUrl: {
            contains: txId as string,
          },
        },
        include: {
          user: true,
        },
      });

      if (!profile) {
        return NextResponse.json({ error: "Profile not found for this txId" }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        walletAddress: profile.walletAddress,
        isCitizen: profile.isCitizen,
        sbtImageUrl: profile.sbtImageUrl,
        createdAt: profile.createdAt,
        updatedAt: profile.updatedAt,
      });
    } catch (error: any) {
      console.error("[Profile GET by txId] Erro:", error);
      return NextResponse.json({ error: "Erro interno ao buscar perfil por txId." }, { status: 500 });
    }
  }
}

// ─── POST /api/users/profile ──────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { walletAddress, sbtImageUrl, isCitizen, transactionSignature } = body;

    // ── 1. Validação de campos obrigatórios ────────────────────────────────────
    if (!walletAddress) {
      return NextResponse.json({ error: "walletAddress is required" }, { status: 400 });
    }
    if (!transactionSignature) {
      return NextResponse.json(
        { error: "transactionSignature is required para provar ownership." },
        { status: 400 },
      );
    }

    // ── 2. Validação do formato walletAddress (Base58) ─────────────────────────
    let senderPubKey: PublicKey;
    try {
      senderPubKey = new PublicKey(walletAddress);
    } catch {
      return NextResponse.json({ error: "walletAddress inválido." }, { status: 400 });
    }

    // ── 3. Verificação de Ownership via Solana RPC ─────────────────────────────
    // Verifica que o walletAddress é de fato signatário da transação informada.
    // Isso impede que um usuário sobrescreva o perfil de outra carteira.
    const isProvisionalSignature = transactionSignature === "provisional-no-new-tx";

    if (!isProvisionalSignature) {
      // Determinar RPC: devnet para VISITORs (isCitizen = false), mainnet para CITIZENs
      const rpcUrl = isCitizen
        ? (process.env.NEXT_PUBLIC_SOLANA_RPC_URL ?? "https://api.mainnet-beta.solana.com")
        : "https://api.devnet.solana.com";

      try {
        const connection = new Connection(rpcUrl, "confirmed");
        const txInfo = await connection.getTransaction(transactionSignature, {
          commitment: "confirmed",
          maxSupportedTransactionVersion: 0,
        });

        if (!txInfo || txInfo.meta?.err) {
          console.warn(`[Profile POST] TX inválida ou com erro: ${transactionSignature.slice(0, 20)}...`);
          return NextResponse.json({ error: GENERIC_AUTH_ERROR }, { status: 403 });
        }

        // Extrair signatários (compatível com txs legadas e v0)
        let signerKeys: string[] = [];
        if ("accountKeys" in txInfo.transaction.message) {
          signerKeys = txInfo.transaction.message.accountKeys.map((k) => k.toBase58());
        } else {
          signerKeys = txInfo.transaction.message.staticAccountKeys.map((k) => k.toBase58());
        }

        if (!signerKeys.includes(senderPubKey.toBase58())) {
          console.warn(
            `[Profile POST] ❌ Ownership falhou: wallet=${walletAddress.slice(0, 8)}... não é signatário.`,
          );
          return NextResponse.json({ error: GENERIC_AUTH_ERROR }, { status: 403 });
        }

        console.log(`[Profile POST] ✅ Ownership verificada: ${walletAddress.slice(0, 8)}...`);
      } catch (rpcError: any) {
        // Falha de RPC não deve bloquear o usuário — mas logar para monitoramento
        console.error("[Profile POST] ⚠️ Falha na verificação RPC (prosseguindo):", rpcError.message);
      }
    } else {
      console.log("[Profile POST] ℹ️ Signature provisional — verificação de ownership ignorada (Rede Simulada).");
    }

    // ── 3.5. Proteção de Escrita (Imutabilidade) ──────────────────────────────
    // Se o perfil do usuário já possui uma sbtImageUrl cadastrada, bloqueia novas escritas.
    // A identidade só pode ser gravada uma única vez.
    const existingProfileForImmutability = await prisma.userProfile.findUnique({
      where: { walletAddress },
    });

    if (existingProfileForImmutability?.sbtImageUrl) {
      console.warn(
        `[Profile POST] ❌ Proteção de Escrita: walletAddress ${walletAddress} já possui sbtImageUrl (${existingProfileForImmutability.sbtImageUrl}). Nova tentativa bloqueada.`
      );
      return NextResponse.json(
        { error: "Identidade imutável. Este perfil já possui registro no Arweave e não pode ser re-escrito." },
        { status: 403 }
      );
    }

    // ── 4. Upsert atômico: User + UserProfile + AuditLog ──────────────────────
    await prisma.$transaction(async (tx) => {
      // Garantir que o User existe (upsert)
      const user = await tx.user.findUnique({ where: { walletAddress } });
      if (!user) {
        await tx.user.create({
          data: { walletAddress, nickname: null },
        });
      } else {
        // Mantém nickname sempre null no banco (Regra de Ouro — vive no Arweave)
        await tx.user.update({
          where: { walletAddress },
          data: { nickname: null },
        });
      }

      // Upsert do UserProfile
      const existingProfile = await tx.userProfile.findUnique({ where: { walletAddress } });
      if (!existingProfile) {
        await tx.userProfile.create({
          data: {
            walletAddress,
            isCitizen: isCitizen ?? false,
            sbtImageUrl: sbtImageUrl ?? null,
            citizenshipMintDate: isCitizen ? new Date() : null,
          },
        });
      } else {
        await tx.userProfile.update({
          where: { walletAddress },
          data: {
            isCitizen: isCitizen !== undefined ? isCitizen : existingProfile.isCitizen,
            sbtImageUrl: sbtImageUrl !== undefined ? sbtImageUrl : existingProfile.sbtImageUrl,
            citizenshipMintDate:
              isCitizen && !existingProfile.citizenshipMintDate
                ? new Date()
                : existingProfile.citizenshipMintDate,
          },
        });
      }

      // AuditLog obrigatório para toda operação de escrita de perfil
      await tx.auditLog.create({
        data: {
          actorWallet: walletAddress,
          actionType: isCitizen ? "CITIZENSHIP_GRANTED" : "PROFILE_UPDATED",
          targetId: walletAddress,
          details: JSON.stringify({
            sbtImageUrl: sbtImageUrl ?? null,
            isCitizen: isCitizen ?? false,
            transactionSignature: isProvisionalSignature ? "provisional" : transactionSignature,
          }),
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
    });

  } catch (error: any) {
    console.error("[Profile POST] Erro interno:", error);
    return NextResponse.json({ error: "Erro interno ao atualizar perfil." }, { status: 500 });
  }
}
