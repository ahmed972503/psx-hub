import { COMPANIES } from "@/data/universe";
import { matchCompanies } from "@/lib/intelligence/engine";
import { formatDay } from "@/lib/format";
import { prisma } from "@/server/db";

type Citation = { title: string; url: string };

async function finish(userId: string, question: string, answer: string, citations: Citation[]) {
  await prisma.aiLog.create({ data: { userId, question, answer, citations } });
  return { answer, citations };
}

export async function askPlatform(question: string, userId: string) {
  const trimmed = question.trim();
  const citations: Citation[] = [];
  if (trimmed.length < 3) {
    return finish(userId, trimmed, "Ask about a ticker, a dividend window, or a macro exposure such as oil or interest rates.", citations);
  }

  const companies = matchCompanies(trimmed, COMPANIES);

  if (/interest rate|rate cut|lower rates|policy rate/i.test(trimmed) && /benefit|help|which stock|who benefit/i.test(trimmed)) {
    const rows = await prisma.exposure.findMany({
      where: { factor: "INTEREST_RATE", sensitivity: "HURT_WHEN_FACTOR_RISES" },
      include: { company: true },
      orderBy: { weight: "desc" },
      take: 8,
    });
    const names = rows.map((row) => `${row.company.ticker} (${row.company.name})`).join(", ");
    return finish(
      userId,
      trimmed,
      names
        ? `From the exposure map, these companies are recorded as hurt when interest rates rise, so a confirmed rate cut can be a relative positive: ${names}. This is a mapping, not a recommendation or a price forecast.`
        : "I could not find a confirmed exposure mapping for that question.",
      citations,
    );
  }

  if (/dividend/i.test(trimmed)) {
    const start = new Date();
    const end = new Date(Date.now() + 7 * 86400000);
    const dividends = await prisma.dividend.findMany({
      where: {
        OR: [
          { announcementDate: { gte: new Date(Date.now() - 14 * 86400000) } },
          { bookClosureStart: { gte: start, lte: end } },
        ],
      },
      include: { company: true },
      orderBy: { announcementDate: "desc" },
      take: 10,
    });
    if (dividends.length === 0) {
      return finish(userId, trimmed, "I could not find a confirmed public source for a dividend in the current window.", citations);
    }
    const lines = dividends.map((dividend) => {
      if (dividend.sourceUrl) citations.push({ title: dividend.company.ticker, url: dividend.sourceUrl });
      const rate = dividend.percent ? `${dividend.percent}%` : "rate not stated in the source";
      return `${dividend.company.ticker}: ${rate}, announced ${formatDay(dividend.announcementDate)}.`;
    });
    return finish(userId, trimmed, lines.join(" "), citations);
  }

  if (companies.length === 1) {
    const company = await prisma.company.findUnique({
      where: { ticker: companies[0].ticker },
      include: {
        impacts: {
          include: { item: true },
          orderBy: { item: { processedAt: "desc" } },
          take: 5,
        },
      },
    });
    if (!company || company.impacts.length === 0) {
      return finish(userId, trimmed, `I could not find a confirmed public catalyst for ${companies[0].ticker} in the platform archive.`, citations);
    }
    const lines = company.impacts.map((impact) => {
      citations.push({ title: impact.item.headline, url: impact.item.primaryUrl });
      return `${impact.item.headline} Mapped effect: ${impact.direction.toLowerCase()}, strength ${impact.strength}/100. ${impact.reason}`;
    });
    return finish(
      userId,
      trimmed,
      `Records for ${company.ticker}: ${lines.join(" ")} Price movement cannot be confirmed because no licensed price feed is connected.`,
      citations,
    );
  }

  if (/today|announcement/i.test(trimmed)) {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const items = await prisma.intelligenceItem.findMany({
      where: { visible: true, processedAt: { gte: start } },
      orderBy: { impactScore: "desc" },
      take: 5,
    });
    if (items.length === 0) return finish(userId, trimmed, "No visible intelligence items have been processed today.", citations);
    items.forEach((item) => citations.push({ title: item.headline, url: item.primaryUrl }));
    return finish(userId, trimmed, items.map((item) => item.headline).join(" "), citations);
  }

  return finish(
    userId,
    trimmed,
    "I can answer from platform records about a ticker, recent announcements, dividends, or which mapped companies are hurt when interest rates rise. I could not match this question to those records.",
    citations,
  );
}
