import { createHash } from "crypto";
import type { Direction, Priority, Relevance, Verification } from "@prisma/client";
import { COMPANIES, SECTORS } from "@/data/universe";
import { analyze } from "@/lib/intelligence/engine";
import { detectLanguage, headlineTokens, jaccard, normalizeHeadline } from "@/lib/intelligence/extract";
import { prisma } from "@/server/db";

function hashContent(headline: string, excerpt: string | null) {
  return createHash("sha256").update(`${normalizeHeadline(headline)}|${excerpt ?? ""}`).digest("hex");
}

function verificationFor(category: string, sourceCount: number): Verification {
  if (/official|regulator|company/i.test(category)) return "OFFICIAL";
  if (sourceCount >= 2) return "MULTIPLE_SOURCES";
  return "SINGLE_SOURCE";
}

function passesSensitivity(sensitivity: string, priority: Priority) {
  if (priority === "INFORMATIONAL" || priority === "LOW") return sensitivity === "high";
  if (priority === "MEDIUM") return sensitivity !== "low";
  return true;
}

function inQuietHours(start?: string | null, end?: string | null) {
  if (!start || !end) return false;
  const now = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone: "Asia/Karachi",
  }).format(new Date());
  if (start <= end) return now >= start && now < end;
  return now >= start || now < end;
}

export async function fanOutAlerts(itemId: string) {
  const item = await prisma.intelligenceItem.findUnique({
    where: { id: itemId },
    include: { stockImpacts: true },
  });
  if (!item || !item.shouldAlert) return 0;
  const companyIds = item.stockImpacts.map((impact) => impact.companyId);
  if (companyIds.length === 0) return 0;
  const watchers = await prisma.watchlistItem.findMany({
    where: { companyId: { in: companyIds } },
    include: { user: { include: { preference: true } } },
  });
  let created = 0;
  for (const watcher of watchers) {
    if (watcher.user.status !== "ACTIVE") continue;
    const preference = watcher.user.preference;
    const sensitivity = preference?.alertSensitivity ?? "medium";
    if (!passesSensitivity(sensitivity, item.priority)) continue;
    if (inQuietHours(preference?.quietStart, preference?.quietEnd)) continue;
    const channels = preference?.channels?.length ? preference.channels : ["IN_APP"];
    if (!channels.includes("IN_APP")) continue;
    const existing = await prisma.alert.findFirst({
      where: { userId: watcher.userId, itemId: item.id, channel: "IN_APP" },
    });
    if (existing) continue;
    await prisma.alert.create({
      data: {
        userId: watcher.userId,
        itemId: item.id,
        channel: "IN_APP",
        priority: item.priority,
        status: "DELIVERED",
        title: `${item.priority} · ${item.headline}`.slice(0, 180),
        body: item.possibleImpact,
        deliveredAt: new Date(),
      },
    });
    created += 1;
  }
  return created;
}

async function storeAnalysis(options: {
  clusterId: string;
  headline: string;
  excerpt: string | null;
  url: string;
  sourceName: string;
  sourceCategory: string;
  sourceReliability: number;
  publishedAt: Date | null;
  ingestedAt: Date;
  sourceCount: number;
  language: string;
}) {
  const analysis = analyze({
    headline: options.headline,
    excerpt: options.excerpt,
    sourceReliability: options.sourceReliability,
    sourceCategory: options.sourceCategory,
    companies: COMPANIES,
    sectors: SECTORS,
  });
  const settings = await prisma.platformSetting.findUnique({ where: { id: 1 } });
  const needsReview =
    Boolean(settings?.requireReviewForHighAlerts) &&
    analysis.shouldAlert &&
    (analysis.priority === "critical" || analysis.priority === "high");
  const visible = analysis.relevance === "high" || analysis.relevance === "relevant" || analysis.relevance === "potential";
  const companies = await prisma.company.findMany({
    where: { ticker: { in: analysis.affectedStocks.map((stock) => stock.ticker) } },
  });
  const sectors = await prisma.sector.findMany({
    where: { slug: { in: analysis.affectedSectors.map((sector) => sector.slug) } },
  });
  const byTicker = new Map(companies.map((company) => [company.ticker, company]));
  const bySlug = new Map(sectors.map((sector) => [sector.slug, sector]));

  const item = await prisma.intelligenceItem.upsert({
    where: { clusterId: options.clusterId },
    create: {
      clusterId: options.clusterId,
      headline: options.headline,
      summary: analysis.summary,
      fact: analysis.fact,
      interpretation: analysis.interpretation,
      possibleImpact: analysis.possibleImpact,
      simpleEn: analysis.simple.en,
      simpleUr: analysis.simple.ur,
      simpleRoman: analysis.simple.roman,
      relevance: analysis.relevance.toUpperCase() as Relevance,
      relevanceScore: analysis.relevanceScore,
      eventType: analysis.eventType,
      direction: analysis.marketImpact.toUpperCase() as Direction,
      impactScore: analysis.impactStrength,
      confidence: analysis.confidence,
      confidenceLabel: analysis.confidenceLabel,
      timeHorizon: analysis.timeHorizon,
      relationship: analysis.relationship,
      reasoning: analysis.reasoning,
      risks: analysis.risks,
      figures: analysis.figures,
      shouldAlert: analysis.shouldAlert,
      priority: analysis.priority.toUpperCase() as Priority,
      verification: verificationFor(options.sourceCategory, options.sourceCount),
      reviewStatus: needsReview ? "PENDING" : "NOT_REQUIRED",
      visible,
      language: options.language,
      primaryUrl: options.url,
      primarySource: options.sourceName,
      publishedAt: options.publishedAt,
      ingestedAt: options.ingestedAt,
    },
    update: {
      headline: options.headline,
      summary: analysis.summary,
      fact: analysis.fact,
      interpretation: analysis.interpretation,
      possibleImpact: analysis.possibleImpact,
      simpleEn: analysis.simple.en,
      simpleUr: analysis.simple.ur,
      simpleRoman: analysis.simple.roman,
      relevance: analysis.relevance.toUpperCase() as Relevance,
      relevanceScore: analysis.relevanceScore,
      eventType: analysis.eventType,
      direction: analysis.marketImpact.toUpperCase() as Direction,
      impactScore: analysis.impactStrength,
      confidence: analysis.confidence,
      confidenceLabel: analysis.confidenceLabel,
      timeHorizon: analysis.timeHorizon,
      relationship: analysis.relationship,
      reasoning: analysis.reasoning,
      risks: analysis.risks,
      figures: analysis.figures,
      shouldAlert: analysis.shouldAlert,
      priority: analysis.priority.toUpperCase() as Priority,
      verification: verificationFor(options.sourceCategory, options.sourceCount),
      visible,
      primaryUrl: options.url,
      primarySource: options.sourceName,
      publishedAt: options.publishedAt,
      processedAt: new Date(),
    },
  });

  await prisma.stockImpact.deleteMany({ where: { itemId: item.id } });
  await prisma.sectorImpact.deleteMany({ where: { itemId: item.id } });
  await prisma.corporateEvent.deleteMany({ where: { itemId: item.id } });

  const stockRows = analysis.affectedStocks.flatMap((stock) => {
    const company = byTicker.get(stock.ticker);
    if (!company) return [];
    return [{
      itemId: item.id,
      companyId: company.id,
      direction: stock.direction.toUpperCase() as Direction,
      strength: stock.strength,
      confidence: stock.confidence,
      relationship: stock.relationship,
      horizon: stock.horizon,
      reason: stock.reason,
    }];
  });
  if (stockRows.length) await prisma.stockImpact.createMany({ data: stockRows });

  const sectorRows = analysis.affectedSectors.flatMap((sector) => {
    const row = bySlug.get(sector.slug);
    if (!row) return [];
    return [{
      itemId: item.id,
      sectorId: row.id,
      direction: sector.direction.toUpperCase() as Direction,
      reason: sector.reason,
    }];
  });
  if (sectorRows.length) await prisma.sectorImpact.createMany({ data: sectorRows });

  const corporate = analysis.eventType !== "NEWS" && analysis.affectedStocks.some((stock) => stock.relationship === "direct");
  if (corporate) {
    const primary = analysis.affectedStocks.find((stock) => stock.relationship === "direct");
    const company = primary ? byTicker.get(primary.ticker) : undefined;
    const event = await prisma.corporateEvent.create({
      data: {
        itemId: item.id,
        companyId: company?.id,
        eventType: analysis.eventType,
        title: options.headline,
        announcementTime: options.publishedAt,
        eventDate: analysis.dates.eventDate,
        meetingDate: analysis.dates.meetingDate,
        bookClosureStart: analysis.dates.bookClosureStart,
        bookClosureEnd: analysis.dates.bookClosureEnd,
        paymentDate: analysis.dates.paymentDate,
        importance: analysis.priority,
        uncertain: analysis.uncertainDates || analysis.figures.length === 0,
        extractedData: {
          figures: analysis.figures,
          dividend: analysis.dividend,
          risks: analysis.risks,
        },
        sourceUrl: options.url,
        sourceName: options.sourceName,
      },
    });
    if (company && analysis.dividend && (analysis.eventType === "DIVIDEND" || analysis.eventType === "BONUS")) {
      await prisma.dividend.create({
        data: {
          eventId: event.id,
          companyId: company.id,
          percent: analysis.dividend.percent,
          perShare: analysis.dividend.perShare,
          announcementDate: options.publishedAt,
          bookClosureStart: analysis.dates.bookClosureStart,
          bookClosureEnd: analysis.dates.bookClosureEnd,
          paymentDate: analysis.dates.paymentDate,
          uncertain: analysis.dividend.percent === null && analysis.dividend.perShare === null,
          notes: analysis.dividend.percent === null ? "No dividend rate was written in the source text." : null,
          sourceUrl: options.url,
        },
      });
    }
    if (company && analysis.eventType === "FINANCIAL_RESULT" && analysis.figures.length > 0) {
      await prisma.financialResult.create({
        data: {
          eventId: event.id,
          companyId: company.id,
          figures: analysis.figures,
          summary: "Only figures explicitly written in the source text are stored.",
          uncertain: true,
          sourceUrl: options.url,
          publishedAt: options.publishedAt,
        },
      });
    }
  }

  if (needsReview) {
    await prisma.alertReview.upsert({
      where: { itemId: item.id },
      create: { itemId: item.id, status: "PENDING" },
      update: { status: "PENDING", reviewedAt: null },
    });
  } else if (analysis.shouldAlert) {
    await fanOutAlerts(item.id);
  }

  return { itemId: item.id, visible, relevance: analysis.relevance };
}

export async function ingestItem(input: {
  sourceId: string;
  sourceUrl: string;
  headline: string;
  excerpt: string | null;
  publishedAt: Date | null;
}) {
  const source = await prisma.source.findUnique({ where: { id: input.sourceId } });
  if (!source) throw new Error("Source not found");
  const headline = input.headline.trim();
  if (headline.length < 8) return { created: false, reason: "Headline is too short." };
  const excerpt = input.excerpt;
  const contentHash = hashContent(headline, excerpt);
  const language = detectLanguage(`${headline} ${excerpt ?? ""}`);
  const existing = await prisma.rawNews.findUnique({ where: { sourceUrl: input.sourceUrl } });
  if (existing && existing.contentHash === contentHash) return { created: false, reason: "Already stored." };

  const since = new Date(Date.now() - 72 * 60 * 60 * 1000);
  const recent = await prisma.rawNews.findMany({
    where: { publishedAt: { gte: since } },
    include: { cluster: true },
    orderBy: { fetchedAt: "desc" },
    take: 200,
  });
  const tokens = headlineTokens(headline);
  const match = recent.find((row) => row.clusterId && jaccard(tokens, headlineTokens(row.headline)) >= 0.72);

  const ingestedAt = new Date();
  let clusterId = match?.clusterId ?? null;
  if (!clusterId) {
    const cluster = await prisma.newsCluster.create({
      data: {
        canonicalHeadline: headline,
        firstPublishedAt: input.publishedAt,
        latestUpdateAt: input.publishedAt,
        sourceCount: 1,
      },
    });
    clusterId = cluster.id;
  } else if (match?.cluster) {
    await prisma.newsCluster.update({
      where: { id: clusterId },
      data: {
        sourceCount: { increment: existing ? 0 : 1 },
        latestUpdateAt: input.publishedAt ?? new Date(),
      },
    });
  }

  if (existing) {
    await prisma.rawNews.update({
      where: { id: existing.id },
      data: { headline, excerpt, contentHash, publishedAt: input.publishedAt, language, processingStatus: "PROCESSED", clusterId },
    });
  } else {
    await prisma.rawNews.create({
      data: {
        sourceId: source.id,
        sourceUrl: input.sourceUrl,
        headline,
        excerpt,
        publishedAt: input.publishedAt,
        language,
        contentHash,
        processingStatus: "PROCESSED",
        clusterId,
      },
    });
  }

  const cluster = await prisma.newsCluster.findUnique({ where: { id: clusterId } });
  const result = await storeAnalysis({
    clusterId,
    headline: cluster?.canonicalHeadline ?? headline,
    excerpt,
    url: input.sourceUrl,
    sourceName: source.name,
    sourceCategory: source.category,
    sourceReliability: source.reliability,
    publishedAt: input.publishedAt ?? cluster?.firstPublishedAt ?? null,
    ingestedAt,
    sourceCount: cluster?.sourceCount ?? 1,
    language,
  });

  await prisma.source.update({
    where: { id: source.id },
    data: { lastItemAt: new Date(), articleCount: { increment: existing ? 0 : 1 } },
  });

  return { created: !existing, ...result };
}
