const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const assets = await prisma.asset.findMany();
  console.log("Total assets:", assets.length);
  assets.forEach(a => {
    console.log(`- ID: ${a.id}, Name: ${a.name}, isListed: ${a.isListed}, status: ${a.status}`);
  });
  
  const gabtournt = assets.find(a => a.name && a.name.toUpperCase().includes('GABTOURNT'));
  console.log("GABTOURNT exists?", !!gabtournt);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
