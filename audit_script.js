const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("--- ASSETS ---");
  const assets = await prisma.asset.findMany({
    select: { id: true, ownerWallet: true, isListed: true, status: true, name: true }
  });
  console.table(assets);

  console.log("\n--- INVESTMENT RECEIPTS (Transactions/Fractions) ---");
  const receipts = await prisma.investmentReceipt.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' }
  });
  console.table(receipts);

  console.log("\n--- CREDIT LEDGER (Transactions) ---");
  const ledger = await prisma.credit_ledger.findMany({
    take: 5,
    orderBy: { created_at: 'desc' },
    select: { id: true, user_id: true, operation_type: true, amount: true, crypto_amount: true, created_at: true }
  });
  console.table(ledger);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
