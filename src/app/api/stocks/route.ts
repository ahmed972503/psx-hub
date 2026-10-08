import { getCurrentUser } from "@/server/auth";
import { prisma } from "@/server/db";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Authentication required." }, { status: 401 });
  const companies = await prisma.company.findMany({
    include: { sector: true },
    orderBy: { ticker: "asc" },
  });
  return Response.json({ companies: companies.map((company) => ({ ticker: company.ticker, name: company.name, sector: company.sector.name })) });
}
