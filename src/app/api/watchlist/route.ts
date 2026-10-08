import { getCurrentUser } from "@/server/auth";
import { prisma } from "@/server/db";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Authentication required." }, { status: 401 });
  const items = await prisma.watchlistItem.findMany({
    where: { userId: user.id },
    include: { company: true },
  });
  return Response.json({ items: items.map((item) => item.company.ticker) });
}
