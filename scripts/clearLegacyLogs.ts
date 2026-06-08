import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log("Iniciando a limpeza TOTAL de logs legados...");
  
  const result = await prisma.auditLog.deleteMany({});

  console.log(`Limpeza concluída! ${result.count} logs foram deletados.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
