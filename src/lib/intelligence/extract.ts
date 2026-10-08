const MONTHS: Record<string, number> = {
  jan: 0,
  january: 0,
  feb: 1,
  february: 1,
  mar: 2,
  march: 2,
  apr: 3,
  april: 3,
  may: 4,
  jun: 5,
  june: 5,
  jul: 6,
  july: 6,
  aug: 7,
  august: 7,
  sep: 8,
  sept: 8,
  september: 8,
  oct: 9,
  october: 9,
  nov: 10,
  november: 10,
  dec: 11,
  december: 11,
};

export function stripHtml(value: string) {
  const decoded = value
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'");
  return decoded
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

export function clipExcerpt(value: string | null | undefined, max = 320) {
  if (!value) return null;
  const clean = stripHtml(value);
  if (!clean) return null;
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max - 1).trimEnd()}…`;
}

export function detectLanguage(text: string) {
  return /[\u0600-\u06FF]/.test(text) ? "ur" : "en";
}

export function normalizeHeadline(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function headlineTokens(value: string) {
  const stop = new Set([
    "the", "and", "for", "with", "from", "that", "this", "after", "before",
    "into", "over", "under", "pakistan", "psx", "says", "said", "will",
  ]);
  return normalizeHeadline(value)
    .split(" ")
    .filter((token) => token.length > 2 && !stop.has(token));
}

export function jaccard(left: string[], right: string[]) {
  const a = new Set(left);
  const b = new Set(right);
  let intersection = 0;
  for (const token of a) if (b.has(token)) intersection += 1;
  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

export function parseDates(text: string) {
  const dates: Date[] = [];
  const monthPattern =
    /\b(\d{1,2})(?:st|nd|rd|th)?\s+(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+(\d{4})\b/gi;
  for (const match of text.matchAll(monthPattern)) {
    const day = Number(match[1]);
    const month = MONTHS[match[2].toLowerCase()];
    const year = Number(match[3]);
    const date = new Date(Date.UTC(year, month, day));
    if (date.getUTCMonth() === month && date.getUTCDate() === day) dates.push(date);
  }
  for (const match of text.matchAll(/\b(\d{4})-(\d{2})-(\d{2})\b/g)) {
    const year = Number(match[1]);
    const month = Number(match[2]) - 1;
    const day = Number(match[3]);
    const date = new Date(Date.UTC(year, month, day));
    if (date.getUTCMonth() === month && date.getUTCDate() === day) dates.push(date);
  }
  return dates;
}

export function extractDividend(text: string) {
  const percent =
    text.match(/dividend[^.]{0,50}?(\d+(?:\.\d+)?)\s*%/i) ??
    text.match(/(\d+(?:\.\d+)?)\s*%[^.]{0,40}?dividend/i);
  const perShare = text.match(
    /dividend[^.]{0,70}?(?:rs\.?|pkr)\s*(\d+(?:\.\d+)?)\s*(?:per share|\/share)/i,
  );
  const percentValue = percent ? Number(percent[1]) : null;
  const shareValue = perShare ? Number(perShare[1]) : null;
  return {
    percent: percentValue !== null && percentValue > 0 && percentValue <= 500 ? percentValue : null,
    perShare: shareValue !== null && shareValue > 0 && shareValue < 100000 ? shareValue : null,
  };
}

const FIGURES: { label: string; pattern: RegExp }[] = [
  { label: "Revenue", pattern: /revenue\s*(?:of|:)?\s*(?:rs\.?|pkr\s*)?(\d{1,3}(?:,\d{3})*(?:\.\d+)?|\d+(?:\.\d+)?)\s*(billion|million|bn|mn|crore)?/i },
  { label: "Gross profit", pattern: /gross profit\s*(?:of|:)?\s*(?:rs\.?|pkr\s*)?(\d{1,3}(?:,\d{3})*(?:\.\d+)?|\d+(?:\.\d+)?)\s*(billion|million|bn|mn|crore)?/i },
  { label: "Profit after tax", pattern: /(?:profit after tax|pat)\s*(?:of|:)?\s*(?:rs\.?|pkr\s*)?(\d{1,3}(?:,\d{3})*(?:\.\d+)?|\d+(?:\.\d+)?)\s*(billion|million|bn|mn|crore)?/i },
  { label: "EPS", pattern: /\beps\s*(?:of|:)?\s*(?:rs\.?|pkr\s*)?(\d+(?:\.\d+)?)/i },
];

export function extractFigures(text: string) {
  const figures: { label: string; value: string }[] = [];
  for (const figure of FIGURES) {
    const match = text.match(figure.pattern);
    if (!match) continue;
    const unit = match[2] ? ` ${match[2]}` : "";
    figures.push({ label: figure.label, value: `${match[1]}${unit}`.trim() });
  }
  return figures;
}

export function extractEventDates(text: string, eventType: string) {
  const dates = parseDates(text);
  const lower = text.toLowerCase();
  const result = {
    eventDate: null as Date | null,
    meetingDate: null as Date | null,
    bookClosureStart: null as Date | null,
    bookClosureEnd: null as Date | null,
    paymentDate: null as Date | null,
    uncertainDates: false,
  };
  if (dates.length === 0) return result;

  if (lower.includes("book closure") && dates.length >= 2) {
    result.bookClosureStart = dates[0];
    result.bookClosureEnd = dates[1];
  } else if (lower.includes("book closure") && dates.length === 1) {
    result.bookClosureStart = dates[0];
    result.uncertainDates = true;
  }

  if (/(payment date|payable on)/i.test(text)) {
    result.paymentDate = dates[dates.length - 1];
  }

  if (/(board meeting|meeting of the board)/i.test(text)) {
    result.meetingDate = dates[0];
    result.eventDate = dates[0];
  } else if (eventType === "DIVIDEND" || eventType === "BOOK_CLOSURE") {
    result.eventDate = dates[0];
  } else if (dates.length === 1) {
    result.eventDate = dates[0];
    result.uncertainDates = !result.meetingDate && !result.bookClosureStart;
  }

  return result;
}
