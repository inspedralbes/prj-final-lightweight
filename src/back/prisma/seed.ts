import { PrismaClient } from '@prisma/client';
import { seedE2EData } from '../src/prisma/e2e-seed';

const prisma = new PrismaClient();

async function main() {
  const result = await seedE2EData(prisma);
  console.log('[seed] E2E seed applied:', JSON.stringify(result, null, 2));
}

main()
  .catch((err) => {
    console.error('[seed] Failed:', err);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
