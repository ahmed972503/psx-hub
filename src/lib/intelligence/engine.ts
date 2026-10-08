import type {
  Analysis,
  CompanyRecord,
  Direction,
  Factor,
  SectorRecord,
  Sensitivity,
} from "@/lib/intelligence/types";
import { extractDividend, extractEventDates, extractFigures } from "@/lib/intelligence/extract";

const BLOCKLIST = [
  "celebrity",
  "cricket",
  "football match",
  "movie",
  "drama serial",
  "bollywood",
  "hollywood",
  "fashion week",
  "wedding",
];

const FACTOR_PATTERNS: { factor: Factor; pattern: RegExp }[] = [
  { factor: "OIL", pattern: /\b(crude oil|oil prices?|brent|wti)\b/i },
  { factor: "GAS", pattern: /\b(gas tariff|gas price|natural gas|wellhead gas)\b/i },
  { factor: "COAL", pattern: /\b(coal prices?|coal cost)\b/i },
  { factor: "LNG", pattern: /\blng\b/i },
  { factor: "ELECTRICITY", pattern: /\b(electricity tariff|power tariff|electricity price|neprah?|power price)\b/i },
  { factor: "INTEREST_RATE", pattern: /\b(policy rate|interest rates?|sbp rate|discount rate|rate cut|rate hike)\b/i },
  { factor: "USD_PKR", pattern: /\b(rupee|pkr|usd\/pkr)\b/i },
  { factor: "IMF", pattern: /\bimf\b/i },
  { factor: "TAX", pattern: /\b(petroleum levy|sales tax|gst|federal budget|mini budget|tax)\b/i },
  { factor: "INFLATION", pattern: /\b(inflation|cpi)\b/i },
];

const UP = /\b(rise|rises|rose|rising|surge|surges|jump|jumps|higher|gains?|gained|increas\w*|hike|hikes|up)\b/i;
const DOWN = /\b(fall|falls|fell|falling|drop|drops|dropped|decline\w*|lower|slump|plunge\w*|cut|cuts|down|depreciat\w*|weaken\w*)\b/i;

type FactorMove = { factor: Factor; direction: "up" | "down" | "unclear" };

function factorDirection(text: string, factor: Factor): FactorMove["direction"] {
  if (factor === "USD_PKR") {
    if (/\b(rupee|pkr)\b/i.test(text) && /\b(falls?|fell|depreciat\w*|weaken\w*|drops?|dropped|slides?)\b/i.test(text)) return "up";
    if (/\b(rupee|pkr)\b/i.test(text) && /\b(gains?|gained|appreciat\w*|strengthen\w*|rises?|rose)\b/i.test(text)) return "down";
    if (/\bdollar\b/i.test(text) && /\b(rises?|rose|gains?|higher|strengthen\w*)\b/i.test(text)) return "up";
    if (/\bdollar\b/i.test(text) && /\b(falls?|fell|weaker|lower)\b/i.test(text)) return "down";
    return "unclear";
  }
  if (factor === "INTEREST_RATE") {
    if (/rate cut|cuts the policy rate|reduces the policy rate|lowers the policy rate/i.test(text)) return "down";
    if (/rate hike|raises the policy rate|increases the policy rate/i.test(text)) return "up";
  }
  const up = UP.test(text);
  const down = DOWN.test(text);
  if (up === down) return "unclear";
  return up ? "up" : "down";
}

const PAKISTAN_ANCHOR = /\b(pakistan|pakistani|psx|kse-?100|karachi stock|state bank|sbp|fbr|secp|ogra|nepra|rupee|pkr|islamabad)\b/i;
const FOREIGN_SUBJECT = /\b(india|indian|rbi|reserve bank of india|china|chinese|federal reserve|eurozone|ecb|bank of england)\b/i;
const NEEDS_PAKISTAN = new Set<Factor>(["INTEREST_RATE", "TAX", "INFLATION", "IMF", "ELECTRICITY", "USD_PKR"]);

function foreignOnly(text: string) {
  return FOREIGN_SUBJECT.test(text) && !/\bpakistan/i.test(text);
}

function pakistanContext(text: string) {
  if (foreignOnly(text)) return false;
  return PAKISTAN_ANCHOR.test(text);
}

function detectFactors(text: string): FactorMove[] {
  const anchored = pakistanContext(text);
  return FACTOR_PATTERNS.filter((entry) => entry.pattern.test(text))
    .filter((entry) => anchored || !NEEDS_PAKISTAN.has(entry.factor))
    .map((entry) => ({
      factor: entry.factor,
      direction: factorDirection(text, entry.factor),
    }));
}

function applySensitivity(sensitivity: Sensitivity, move: "up" | "down" | "unclear"): Direction {
  if (sensitivity === "MIXED" || move === "unclear") return "mixed";
  if (sensitivity === "BENEFITS_WHEN_FACTOR_RISES") return move === "up" ? "positive" : "negative";
  return move === "up" ? "negative" : "positive";
}

type EventKind = {
  eventType: string;
  direction: Direction;
  strength: number;
  horizon: Analysis["timeHorizon"];
  priorityBias: Analysis["priority"];
};

function detectEvent(text: string): EventKind {
  const lower = text.toLowerCase();
  if (/plant shutdown|production halt|suspends production|trading suspension/.test(lower)) {
    return { eventType: "SHUTDOWN", direction: "negative", strength: 78, horizon: "short_term", priorityBias: "high" };
  }
  if (/penalty|fine imposed|show-cause|investigation against|fraud/.test(lower)) {
    return { eventType: "REGULATORY", direction: "negative", strength: 74, horizon: "short_term", priorityBias: "high" };
  }
  if (/no dividend|did not announce a dividend|skipped dividend/.test(lower)) {
    return { eventType: "DIVIDEND", direction: "negative", strength: 64, horizon: "short_term", priorityBias: "high" };
  }
  if (/dividend|bonus shares|right shares|right issue/.test(lower)) {
    const type = /bonus/.test(lower) ? "BONUS" : /right/.test(lower) ? "RIGHT_ISSUE" : "DIVIDEND";
    return { eventType: type, direction: "positive", strength: 68, horizon: "short_term", priorityBias: "high" };
  }
  if (/financial results|profit after tax|earnings per share|\beps\b|quarterly result|net profit|profit rose|profit increased|profit declined|profit fell/.test(lower)) {
    const up = /\b(increas|rise|rose|higher|grew|improved|record)\w*/i.test(text);
    const down = /\b(decreas|fall|fell|decline|lower|loss|slump)\w*/i.test(text);
    const direction: Direction = up && down ? "mixed" : up ? "positive" : down ? "negative" : "neutral";
    return { eventType: "FINANCIAL_RESULT", direction, strength: direction === "neutral" ? 58 : 74, horizon: "short_term", priorityBias: "high" };
  }
  if (/book closure/.test(lower)) {
    return { eventType: "BOOK_CLOSURE", direction: "neutral", strength: 48, horizon: "short_term", priorityBias: "medium" };
  }
  if (/board meeting|meeting of the board/.test(lower)) {
    return { eventType: "BOARD_MEETING", direction: "neutral", strength: 46, horizon: "short_term", priorityBias: "medium" };
  }
  if (/\bagm\b|annual general meeting/.test(lower)) {
    return { eventType: "AGM", direction: "neutral", strength: 40, horizon: "short_term", priorityBias: "medium" };
  }
  if (/\beogm\b|extraordinary general meeting/.test(lower)) {
    return { eventType: "EOGM", direction: "neutral", strength: 44, horizon: "short_term", priorityBias: "medium" };
  }
  if (/corporate briefing/.test(lower)) {
    return { eventType: "CORPORATE_BRIEFING", direction: "neutral", strength: 36, horizon: "short_term", priorityBias: "low" };
  }
  if (/wins? contract|contract awarded|acquisition|merger|joint venture/.test(lower)) {
    return { eventType: /acquisition|merger/.test(lower) ? "MERGER" : "CONTRACT", direction: "mixed", strength: 60, horizon: "medium_term", priorityBias: "medium" };
  }
  if (/ceo resign|chief executive|director resign|management change/.test(lower)) {
    return { eventType: "MANAGEMENT_CHANGE", direction: "mixed", strength: 52, horizon: "short_term", priorityBias: "medium" };
  }
  return { eventType: "NEWS", direction: "neutral", strength: 30, horizon: "unknown", priorityBias: "low" };
}

function boundaryIndex(haystack: string, phrase: string) {
  const source = haystack.toLowerCase();
  const needle = phrase.toLowerCase();
  let from = 0;
  while (from < source.length) {
    const index = source.indexOf(needle, from);
    if (index === -1) return -1;
    const before = index === 0 ? " " : source[index - 1];
    const afterIndex = index + needle.length;
    const after = afterIndex >= source.length ? " " : source[afterIndex];
    if (!/[a-z0-9]/i.test(before) && !/[a-z0-9]/i.test(after)) return index;
    from = index + needle.length;
  }
  return -1;
}

export function matchCompanies(text: string, companies: CompanyRecord[]) {
  const hits: { ticker: string; start: number; end: number }[] = [];
  for (const company of companies) {
    const tickerHit = text.match(new RegExp(`\\b${company.ticker}\\b`, "i"));
    if (tickerHit && tickerHit.index !== undefined) {
      hits.push({ ticker: company.ticker, start: tickerHit.index, end: tickerHit.index + company.ticker.length });
    }
    for (const phrase of [company.name, ...company.aliases].sort((a, b) => b.length - a.length)) {
      const index = boundaryIndex(text, phrase);
      if (index >= 0) hits.push({ ticker: company.ticker, start: index, end: index + phrase.length });
    }
  }
  hits.sort((a, b) => a.start - b.start || b.end - b.start - (a.end - a.start));
  const kept: typeof hits = [];
  for (const hit of hits) {
    const overlaps = kept.some((item) => hit.start < item.end && hit.end > item.start);
    if (!overlaps) kept.push(hit);
  }
  return [...new Set(kept.map((hit) => hit.ticker))]
    .map((ticker) => companies.find((company) => company.ticker === ticker))
    .filter((company): company is CompanyRecord => Boolean(company));
}

function matchSectors(text: string, sectors: SectorRecord[]) {
  return sectors.filter((sector) => sector.phrases.some((phrase) => boundaryIndex(text, phrase) >= 0));
}

function label(score: number): Analysis["confidenceLabel"] {
  if (score >= 75) return "high";
  if (score >= 55) return "medium";
  return "low";
}

function clamp(value: number, min = 0, max = 95) {
  return Math.max(min, Math.min(max, Math.round(value)));
}

function directionWord(direction: Direction) {
  if (direction === "positive") return "potentially positive";
  if (direction === "negative") return "potentially negative";
  if (direction === "mixed") return "mixed";
  return "neutral";
}

export function analyze(input: {
  headline: string;
  excerpt?: string | null;
  sourceReliability: number;
  sourceCategory: string;
  companies: CompanyRecord[];
  sectors: SectorRecord[];
}): Analysis {
  const text = `${input.headline}. ${input.excerpt ?? ""}`.trim();
  const companies = matchCompanies(text, input.companies);
  const sectorHits = foreignOnly(text) ? [] : matchSectors(text, input.sectors);
  const factors = detectFactors(text);
  const event = detectEvent(text);
  const blocked = BLOCKLIST.some((word) => text.toLowerCase().includes(word));
  const hasFinance = factors.length > 0 || event.eventType !== "NEWS";
  const official = /official|company|regulator/i.test(input.sourceCategory);

  let relevance: Analysis["relevance"] = "irrelevant";
  if (blocked && companies.length === 0 && !hasFinance) relevance = "irrelevant";
  else if (companies.length > 0 && (event.eventType !== "NEWS" || factors.length > 0)) relevance = "high";
  else if (companies.length > 0) relevance = "relevant";
  else if (factors.length > 0) relevance = factors.some((factor) => factor.direction !== "unclear") ? "relevant" : "potential";
  else if (sectorHits.length > 0) relevance = "potential";
  else relevance = "irrelevant";

  const primaryFactor = factors[0];
  const affectedStocks: Analysis["affectedStocks"] = [];
  const sectorMap = new Map<string, { direction: Direction; reason: string }>();

  const pushSector = (slug: string, direction: Direction, reason: string) => {
    const existing = sectorMap.get(slug);
    if (!existing || existing.direction === "neutral") sectorMap.set(slug, { direction, reason });
  };

  if (primaryFactor && companies.length === 0) {
    const ranked = input.companies
      .map((company) => ({ company, exposure: company.exposures.find((item) => item.factor === primaryFactor.factor) }))
      .filter((item): item is { company: CompanyRecord; exposure: CompanyRecord["exposures"][number] } => Boolean(item.exposure))
      .sort((a, b) => b.exposure.weight - a.exposure.weight)
      .slice(0, 6);
    for (const item of ranked) {
      const direction = applySensitivity(item.exposure.sensitivity, primaryFactor.direction);
      affectedStocks.push({
        ticker: item.company.ticker,
        direction,
        strength: clamp(item.exposure.weight * (primaryFactor.direction === "unclear" ? 0.35 : 0.8)),
        confidence: clamp(38 + item.exposure.weight * 0.25 + input.sourceReliability * 0.12, 30, 78),
        relationship: "indirect",
        horizon: primaryFactor.factor === "INTEREST_RATE" ? "medium_term" : "short_term",
        reason: item.exposure.note,
      });
      pushSector(item.company.sectorSlug, direction, item.exposure.note);
    }
  }

  for (const company of companies) {
    const exposure = primaryFactor
      ? company.exposures.find((item) => item.factor === primaryFactor.factor)
      : undefined;
    const direction = exposure
      ? applySensitivity(exposure.sensitivity, primaryFactor.direction)
      : event.direction;
    const reason = exposure
      ? `${company.name} is named in the item. ${exposure.note}`
      : event.eventType === "NEWS"
        ? `${company.name} is named, but the text does not establish a confirmed financial effect.`
        : `${company.name} is named in a ${event.eventType.toLowerCase().replaceAll("_", " ")} item. The mapped direction is an interpretation, not a forecast.`;
    affectedStocks.push({
      ticker: company.ticker,
      direction,
      strength: clamp(exposure ? exposure.weight * 0.8 : event.strength),
      confidence: clamp(62 + (official ? 12 : 0) + input.sourceReliability * 0.12, 40, 90),
      relationship: "direct",
      horizon: event.horizon === "unknown" ? "short_term" : event.horizon,
      reason,
    });
    pushSector(company.sectorSlug, direction, reason);
  }

  for (const sector of sectorHits) {
    if (sectorMap.has(sector.slug)) continue;
    pushSector(sector.slug, "mixed", `The text mentions the ${sector.name} sector without a single confirmed company effect.`);
    if (affectedStocks.length === 0) {
      input.companies
        .filter((company) => company.sectorSlug === sector.slug)
        .slice(0, 4)
        .forEach((company) => {
          affectedStocks.push({
            ticker: company.ticker,
            direction: "mixed",
            strength: 28,
            confidence: 42,
            relationship: "indirect",
            horizon: "unknown",
            reason: `Included because the text mentions the ${sector.name} sector, not because a company-specific fact was confirmed.`,
          });
        });
    }
  }

  const uniqueStocks = new Map<string, Analysis["affectedStocks"][number]>();
  for (const stock of affectedStocks) {
    const existing = uniqueStocks.get(stock.ticker);
    if (!existing || stock.relationship === "direct") uniqueStocks.set(stock.ticker, stock);
  }
  const stocks = [...uniqueStocks.values()];
  const directions = stocks.map((stock) => stock.direction);
  let marketImpact: Direction = "neutral";
  if (stocks.length === 0) marketImpact = event.eventType === "NEWS" ? "neutral" : event.direction;
  else if (directions.every((direction) => direction === "positive")) marketImpact = "positive";
  else if (directions.every((direction) => direction === "negative")) marketImpact = "negative";
  else if (directions.some((direction) => direction === "positive") && directions.some((direction) => direction === "negative")) marketImpact = "mixed";
  else if (directions.includes("mixed")) marketImpact = "mixed";
  else marketImpact = directions[0] ?? "neutral";

  const impactStrength = stocks.length
    ? clamp(Math.max(...stocks.map((stock) => stock.strength)))
    : relevance === "irrelevant"
      ? 0
      : event.strength;
  const confidence = stocks.length
    ? clamp(Math.max(...stocks.map((stock) => stock.confidence)))
    : relevance === "irrelevant"
      ? 20
      : 35;
  const relationship: Analysis["relationship"] = stocks.some((stock) => stock.relationship === "direct")
    ? "direct"
    : stocks.length
      ? "indirect"
      : "none";

  const dividend = /dividend/i.test(text) ? extractDividend(text) : null;
  const figures = extractFigures(text);
  const dates = extractEventDates(text, event.eventType);
  const risks = [
    "This score measures how important the item may be. It is not the probability that a share price will rise or fall.",
    stocks.length === 0 ? "No confirmed company mapping was found, so no stock effect is claimed." : "Company mapping can be incomplete when a story uses an unfamiliar name.",
    factors.some((factor) => factor.direction === "unclear") ? "A macro factor is mentioned, but the text does not confirm whether it rose or fell." : "",
    input.sourceReliability < 70 ? "The source reliability score is not in the highest tier." : "",
  ].filter(Boolean);

  const names = stocks.slice(0, 4).map((stock) => stock.ticker).join(", ");
  const fact = figures.length
    ? `${input.headline} Extracted figures are limited to values written in the text: ${figures.map((figure) => `${figure.label} ${figure.value}`).join("; ")}.`
    : input.headline;
  const interpretation = stocks.length
    ? `Rules and exposure mapping treat this as ${directionWord(marketImpact)} for ${names}. ${stocks[0].reason}`
    : "The rules engine did not find a reliable company or sector relationship worth asserting.";
  const possibleImpact = stocks.length
    ? `Possible impact: ${marketImpact}. Strength ${impactStrength}/100. Confidence ${label(confidence)}. Horizon ${event.horizon.replaceAll("_", " ")}. This is an interpretation.`
    : "No possible stock impact is asserted.";

  const simpleEn = stocks.length
    ? `What happened: ${input.headline} Why it matters: ${stocks[0].reason} Stocks in the mapping: ${names}. What is confirmed is the source text. The direction is an interpretation, not a promise.`
    : `What happened: ${input.headline} No confirmed PSX company link was established from the text.`;
  const simpleUr = stocks.length
    ? `کیا ہوا: درج شدہ سرخی۔ یہ نظام ${names} کو اس متن سے جوڑتا ہے۔ سمت ایک تشریح ہے، قیمت کی ضمانت نہیں۔`
    : "اس متن سے کسی PSX کمپنی کا تصدیق شدہ تعلق نہیں ملا۔";
  const simpleRoman = stocks.length
    ? `Kya hua: source ki headline. System ${names} ko is text se map karta hai. Direction ek tashreeh hai, qeemat ki guarantee nahi.`
    : "Is text se kisi PSX company ka confirmed link nahi mila.";

  const shouldAlert =
    relevance !== "irrelevant" &&
    impactStrength >= 60 &&
    confidence >= 55 &&
    stocks.length > 0 &&
    !factors.some((factor) => factor.direction === "unclear" && companies.length === 0);

  let priority = event.priorityBias;
  if (relevance === "irrelevant") priority = "low";
  else if (impactStrength >= 80 && confidence >= 75) priority = "critical";
  else if (impactStrength >= 65) priority = "high";
  else if (event.eventType === "BOARD_MEETING") priority = "medium";
  else if (impactStrength < 40) priority = "informational";

  const relevanceScore =
    relevance === "high" ? clamp(80 + companies.length * 3, 80, 97) :
    relevance === "relevant" ? 68 :
    relevance === "potential" ? 48 : 5;

  return {
    relevance,
    relevanceScore,
    eventType: event.eventType,
    summary: interpretation,
    fact,
    interpretation,
    possibleImpact,
    simple: { en: simpleEn, ur: simpleUr, roman: simpleRoman },
    marketImpact,
    impactStrength: relevance === "irrelevant" ? 0 : impactStrength,
    confidence,
    confidenceLabel: label(confidence),
    timeHorizon: event.horizon,
    relationship,
    affectedSectors: [...sectorMap.entries()].map(([slug, value]) => ({ slug, ...value })),
    affectedStocks: stocks,
    reasoning: interpretation,
    risks,
    shouldAlert,
    priority,
    figures,
    dividend,
    dates: {
      eventDate: dates.eventDate,
      meetingDate: dates.meetingDate,
      bookClosureStart: dates.bookClosureStart,
      bookClosureEnd: dates.bookClosureEnd,
      paymentDate: dates.paymentDate,
    },
    uncertainDates: dates.uncertainDates,
  };
}
