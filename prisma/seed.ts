import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { COMPANIES, SECTORS } from "../src/data/universe";

const prisma = new PrismaClient();

async function main() {
  const email = (process.env.ADMIN_EMAIL ?? "admin@psx.local").toLowerCase();
  const password = process.env.ADMIN_PASSWORD ?? "PSX-Admin-2026!";
  const name = process.env.ADMIN_NAME ?? "Platform Admin";

  for (const sector of SECTORS) {
    await prisma.sector.upsert({
      where: { slug: sector.slug },
      update: { name: sector.name, summary: sector.summary },
      create: { slug: sector.slug, name: sector.name, summary: sector.summary },
    });
  }

  const sectors = await prisma.sector.findMany();
  const sectorId = new Map(sectors.map((sector) => [sector.slug, sector.id]));

  for (const company of COMPANIES) {
    const id = sectorId.get(company.sectorSlug);
    if (!id) throw new Error(`Missing sector ${company.sectorSlug}`);
    const saved = await prisma.company.upsert({
      where: { ticker: company.ticker },
      update: { name: company.name, aliases: company.aliases, sectorId: id },
      create: {
        ticker: company.ticker,
        name: company.name,
        aliases: company.aliases,
        sectorId: id,
        description: `${company.name} is mapped in the starter PSX universe.`,
      },
    });
    for (const exposure of company.exposures) {
      await prisma.exposure.upsert({
        where: { companyId_factor: { companyId: saved.id, factor: exposure.factor } },
        update: { sensitivity: exposure.sensitivity, weight: exposure.weight, note: exposure.note },
        create: { companyId: saved.id, factor: exposure.factor, sensitivity: exposure.sensitivity, weight: exposure.weight, note: exposure.note },
      });
    }
  }

  await prisma.platformSetting.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, requireReviewForHighAlerts: true, relevanceThreshold: 40, alertImpactThreshold: 60 },
  });

  await prisma.marketDataProvider.upsert({
    where: { id: "none" },
    update: {},
    create: {
      id: "none",
      name: "No licensed provider",
      kind: "unavailable",
      enabled: false,
      notes: "Prices, bids, volumes, and index levels stay hidden until a licensed provider is connected.",
    },
  });

  const sources = [
    {
      name: "Dawn Business",
      type: "RSS" as const,
      url: "https://www.dawn.com/feeds/business",
      category: "business_news",
      reliability: 72,
      enabled: true,
      pollIntervalSec: 900,
      notes: "Public RSS feed. Only the headline, link, time, and a short feed excerpt are stored.",
    },
    {
      name: "Analyst intake",
      type: "MANUAL" as const,
      url: null,
      category: "analyst",
      reliability: 80,
      enabled: true,
      pollIntervalSec: 86400,
      notes: "Paste a headline and the original URL. Do not paste a full copyrighted article.",
    },
    {
      name: "Official announcements (not enabled)",
      type: "OFFICIAL" as const,
      url: null,
      category: "official",
      reliability: 95,
      enabled: false,
      pollIntervalSec: 300,
      notes: "Leave disabled until collection from this source is permitted. The platform does not bypass access controls.",
    },
  ];

  for (const source of sources) {
    const existing = await prisma.source.findFirst({ where: { name: source.name } });
    if (!existing) await prisma.source.create({ data: source });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.user.upsert({
    where: { email },
    update: { name, role: "SUPER_ADMIN", status: "ACTIVE", passwordHash, emailVerifiedAt: new Date() },
    create: {
      email,
      name,
      role: "SUPER_ADMIN",
      status: "ACTIVE",
      passwordHash,
      emailVerifiedAt: new Date(),
      preference: { create: { language: "en", alertSensitivity: "high", channels: ["IN_APP"] } },
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
