export type Factor =
  | "OIL"
  | "GAS"
  | "COAL"
  | "LNG"
  | "ELECTRICITY"
  | "INTEREST_RATE"
  | "USD_PKR"
  | "IMF"
  | "TAX"
  | "INFLATION";

export type Sensitivity =
  | "BENEFITS_WHEN_FACTOR_RISES"
  | "HURT_WHEN_FACTOR_RISES"
  | "MIXED";

export type Direction = "positive" | "negative" | "neutral" | "mixed";

export type CompanyRecord = {
  ticker: string;
  name: string;
  sectorSlug: string;
  aliases: string[];
  exposures: {
    factor: Factor;
    sensitivity: Sensitivity;
    weight: number;
    note: string;
  }[];
};

export type SectorRecord = {
  slug: string;
  name: string;
  summary: string;
  phrases: string[];
};

export type Analysis = {
  relevance: "high" | "relevant" | "potential" | "low" | "irrelevant";
  relevanceScore: number;
  eventType: string;
  summary: string;
  fact: string;
  interpretation: string;
  possibleImpact: string;
  simple: { en: string; ur: string; roman: string };
  marketImpact: Direction;
  impactStrength: number;
  confidence: number;
  confidenceLabel: "high" | "medium" | "low";
  timeHorizon: "intraday" | "short_term" | "medium_term" | "long_term" | "unknown";
  relationship: "direct" | "indirect" | "none";
  affectedSectors: { slug: string; direction: Direction; reason: string }[];
  affectedStocks: {
    ticker: string;
    direction: Direction;
    strength: number;
    confidence: number;
    relationship: "direct" | "indirect";
    horizon: string;
    reason: string;
  }[];
  reasoning: string;
  risks: string[];
  shouldAlert: boolean;
  priority: "critical" | "high" | "medium" | "low" | "informational";
  figures: { label: string; value: string }[];
  dividend: { percent: number | null; perShare: number | null } | null;
  dates: {
    eventDate: Date | null;
    meetingDate: Date | null;
    bookClosureStart: Date | null;
    bookClosureEnd: Date | null;
    paymentDate: Date | null;
  };
  uncertainDates: boolean;
};
