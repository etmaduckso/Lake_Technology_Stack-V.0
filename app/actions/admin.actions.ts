"use server";

import { prisma } from "@/lib/db";
import { MASTER_WALLETS } from "@/config/adminWallets";

export async function getAdmins() {
  try {
    const admins = await prisma.adminPermission.findMany({
      orderBy: { createdAt: "desc" },
    });
    return { success: true, admins };
  } catch (error) {
    console.error("Error fetching admins:", error);
    return { success: false, error: "Falha ao buscar administradores" };
  }
}

export async function getUserRole(walletAddress: string) {
  try {
    if (!walletAddress) return { success: false, role: null };

    if (MASTER_WALLETS.includes(walletAddress)) {
      return { success: true, role: "Master" };
    }

    const admin = await prisma.adminPermission.findUnique({
      where: { walletAddress },
      select: { role: true },
    });

    return { success: true, role: admin?.role || null };
  } catch (error) {
    console.error("Error fetching user role:", error);
    return { success: false, role: null };
  }
}

export async function upsertAdmin(walletAddress: string, role: string, masterWallet: string) {
  try {
    if (!MASTER_WALLETS.includes(masterWallet)) {
      return { success: false, error: "Não autorizado: Apenas Master Admins podem conceder acesso" };
    }

    // Ensure the target user exists to satisfy foreign keys
    await prisma.user.upsert({
      where: { walletAddress },
      update: {},
      create: { walletAddress, role: "USER" },
    });

    // Ensure the master user exists for the AuditLog FK
    await prisma.user.upsert({
      where: { walletAddress: masterWallet },
      update: {},
      create: { walletAddress: masterWallet, role: "SUPER_ADMIN" },
    });

    const admin = await prisma.adminPermission.upsert({
      where: { walletAddress },
      update: { role, grantedByMaster: masterWallet },
      create: { walletAddress, role, grantedByMaster: masterWallet },
    });

    await prisma.auditLog.create({
      data: {
        actorWallet: masterWallet,
        actionType: "ADMIN_GRANTED",
        targetId: walletAddress,
        details: `Concedeu a role ${role} para ${walletAddress}`,
      },
    });

    return { success: true, admin };
  } catch (error) {
    console.error("Error upserting admin:", error);
    return { success: false, error: "Falha ao atualizar administrador" };
  }
}

export async function revokeAdmin(walletAddress: string, masterWallet: string) {
  try {
    if (!MASTER_WALLETS.includes(masterWallet)) {
      return { success: false, error: "Não autorizado" };
    }

    await prisma.adminPermission.delete({
      where: { walletAddress },
    });

    await prisma.auditLog.create({
      data: {
        actorWallet: masterWallet,
        actionType: "ADMIN_REVOKED",
        targetId: walletAddress,
        details: `Revogou acesso de ${walletAddress}`,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Error revoking admin:", error);
    return { success: false, error: "Falha ao revogar administrador" };
  }
}
