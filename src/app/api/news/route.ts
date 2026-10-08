import { getCurrentUser } from "@/server/auth";
import { listNews } from "@/server/queries";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Authentication required." }, { status: 401 });
  const items = await listNews(30);
  return Response.json({
    items: items.map((item) => ({
      id: item.id,
      headline: item.headline,
      source: item.primarySource,
      url: item.primaryUrl,
      publishedAt: item.publishedAt,
      direction: item.direction,
      impactScore: item.impactScore,
      confidence: item.confidence,
      tickers: item.stockImpacts.map((impact) => impact.company.ticker),
    })),
  });
}
