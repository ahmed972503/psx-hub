import { prisma } from "@/server/db";
import { marketData } from "@/server/market";

const itemInclude = {
  stockImpacts: { include: { company: { include: { sector: true } } } },
  sectorImpacts: { include: { sector: true } },
  cluster: { include: { rawNews: { include: { source: true } } } },
} as const;

const directions = ["POSITIVE", "NEGATIVE", "MIXED", "NEUTRAL"] as const;

export async function listNews(take = 40, filter?: { source?: string; direction?: string }) {
  const direction = directions.find((value) => value === filter?.direction);
  return prisma.intelligenceItem.findMany({
    where: {
      visible: true,
      ...(filter?.source ? { primarySource: filter.source } : {}),
      ...(direction ? { direction } : {}),
    },
    include: itemInclude,
    orderBy: [{ publishedAt: "desc" }, { processedAt: "desc" }],
    take,
  });
}

export async function newsSources() {
  const rows = await prisma.intelligenceItem.groupBy({
    by: ["primarySource"],
    where: { visible: true },
    orderBy: { primarySource: "asc" },
  });
  return rows.map((row: { primarySource: string }) => row.primarySource);
}

export async function getNews(id: string) {
  return prisma.intelligenceItem.findFirst({
    where: { id, visible: true },
    include: {
      ...itemInclude,
      events: { include: { company: true, dividend: true, result: true } },
    },
  });
}

export async function dashboardData(userId: string) {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const week = new Date(Date.now() + 7 * 86400000);
  const [today, upcoming, watchlist, index] = await Promise.all([
    prisma.intelligenceItem.findMany({
      where: { visible: true, processedAt: { gte: start } },
      include: itemInclude,
      orderBy: { impactScore: "desc" },
      take: 12,
    }),
    prisma.corporateEvent.findMany({
      where: {
        OR: [
          { eventDate: { gte: new Date(), lte: week } },
          { meetingDate: { gte: new Date(), lte: week } },
        ],
      },
      include: { company: { include: { sector: true } } },
      orderBy: { eventDate: "asc" },
      take: 8,
    }),
    prisma.watchlistItem.findMany({
      where: { userId },
      include: { company: { include: { sector: true } } },
      orderBy: { createdAt: "desc" },
    }),
    marketData.getIndex(),
  ]);

  const recentImpacts = await prisma.stockImpact.findMany({
    where: { item: { visible: true, processedAt: { gte: new Date(Date.now() - 48 * 3600 * 1000) } } },
    include: { company: true, item: true },
    orderBy: { strength: "desc" },
    take: 40,
  });
  const scores = new Map<string, { ticker: string; name: string; score: number; why: string }>();
  for (const impact of recentImpacts) {
    const current = scores.get(impact.companyId) ?? {
      ticker: impact.company.ticker,
      name: impact.company.name,
      score: 0,
      why: impact.item.headline,
    };
    current.score += impact.strength * (impact.confidence / 100);
    if (impact.strength > 50) current.why = impact.item.headline;
    scores.set(impact.companyId, current);
  }
  const watch = await Promise.all(watchlist.map(async (item: { company: { ticker: string } }) => ({
    ...item,
    quote: await marketData.getQuote(item.company.ticker),
  })));

  const positive = today.filter((item: { direction: string }) => item.direction === "POSITIVE").length;
  const negative = today.filter((item: { direction: string }) => item.direction === "NEGATIVE").length;
  let tone = "Insufficient news";
  if (today.length > 0 && positive > negative * 1.4) tone = "Bullish";
  else if (today.length > 0 && negative > positive * 1.4) tone = "Bearish";
  else if (today.length > 0 && positive > 0 && negative > 0) tone = "Mixed";
  else if (today.length > 0) tone = "Neutral";

  return {
    today,
    upcoming,
    watch,
    index,
    tone,
    reasons: today.slice(0, 3).map((item: { headline: string }) => item.headline),
    watchToday: [...scores.values()].sort((a, b) => b.score - a.score).slice(0, 5),
  };
}

export async function listEvents() {
  return prisma.corporateEvent.findMany({
    include: { company: { include: { sector: true } } },
    orderBy: [{ eventDate: "asc" }, { createdAt: "desc" }],
    take: 80,
  });
}

export async function listDividends() {
  return prisma.dividend.findMany({
    include: { company: { include: { sector: true } } },
    orderBy: { announcementDate: "desc" },
    take: 80,
  });
}

export async function listResults() {
  return prisma.financialResult.findMany({
    include: { company: true, event: true },
    orderBy: { publishedAt: "desc" },
    take: 40,
  });
}

export async function getCompany(ticker: string) {
  return prisma.company.findUnique({
    where: { ticker: ticker.toUpperCase() },
    include: {
      sector: true,
      exposures: { orderBy: { weight: "desc" } },
      impacts: { include: { item: true }, orderBy: { item: { processedAt: "desc" } }, take: 12 },
      events: { orderBy: { createdAt: "desc" }, take: 12 },
      dividends: { orderBy: { announcementDate: "desc" }, take: 8 },
      results: { orderBy: { publishedAt: "desc" }, take: 6 },
    },
  });
}

export async function searchAll(query: string) {
  const q = query.trim();
  if (q.length < 2) return { companies: [], news: [], events: [] };
  const [companies, news, events] = await Promise.all([
    prisma.company.findMany({
      where: {
        OR: [
          { ticker: { contains: q, mode: "insensitive" } },
          { name: { contains: q, mode: "insensitive" } },
        ],
      },
      include: { sector: true },
      take: 8,
    }),
    prisma.intelligenceItem.findMany({
      where: { visible: true, headline: { contains: q, mode: "insensitive" } },
      orderBy: { processedAt: "desc" },
      take: 10,
    }),
    prisma.corporateEvent.findMany({
      where: { title: { contains: q, mode: "insensitive" } },
      include: { company: true },
      take: 8,
    }),
  ]);
  return { companies, news, events };
}

export async function adminOverview() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const [users, pending, newsToday, visibleToday, events, alerts, failedSources, queue] = await Promise.all([
    prisma.user.count({ where: { status: "ACTIVE" } }),
    prisma.accessRequest.count({ where: { status: "PENDING" } }),
    prisma.rawNews.count({ where: { fetchedAt: { gte: start } } }),
    prisma.intelligenceItem.count({ where: { visible: true, processedAt: { gte: start } } }),
    prisma.corporateEvent.count({ where: { createdAt: { gte: start } } }),
    prisma.alert.count({ where: { createdAt: { gte: start } } }),
    prisma.source.count({ where: { enabled: true, lastError: { not: null } } }),
    prisma.alertReview.count({ where: { status: "PENDING" } }),
  ]);
  return { users, pending, newsToday, visibleToday, events, alerts, failedSources, queue };
}
