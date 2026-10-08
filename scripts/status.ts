import { PrismaClient } from "@prisma/client";

async function main() {
  const prisma = new PrismaClient();
  const news = await prisma.intelligenceItem.count();
  const raw = await prisma.rawNews.count();
  const sources = await prisma.source.findMany({
    select: { name: true, enabled: true, lastError: true, articleCount: true, lastSuccessAt: true },
  });
  console.log(JSON.stringify({ news, raw, sources }, null, 2));
  await prisma.$disconnect();
}

main();
