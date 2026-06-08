const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const result = await prisma.asset.updateMany({
    where: { status: 'APPROVED' },
    data: { isListed: true }
  });
  console.log("Updated assets:", result.count);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
