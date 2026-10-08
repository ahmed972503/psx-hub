import assert from "node:assert/strict";
import { COMPANIES, SECTORS } from "../src/data/universe";
import { analyze } from "../src/lib/intelligence/engine";

const base = { sourceReliability: 80, sourceCategory: "business_news", companies: COMPANIES, sectors: SECTORS };

const dividend = analyze({
  ...base,
  headline: "Meezan Bank announces 20% cash dividend",
});
assert.equal(dividend.affectedStocks.some((stock) => stock.ticker === "MEBL"), true);
assert.equal(dividend.dividend?.percent, 20);
assert.equal(dividend.marketImpact, "positive");
assert.equal(dividend.figures.length, 0);

const oil = analyze({
  ...base,
  headline: "International oil prices rise on supply concerns",
});
assert.equal(oil.affectedStocks.some((stock) => stock.ticker === "OGDC" && stock.direction === "positive"), true);
assert.equal(oil.relationship, "indirect");
assert.equal(oil.figures.length, 0);

const noise = analyze({ ...base, headline: "Celebrity wedding photos draw crowds" });
assert.equal(noise.relevance, "irrelevant");
assert.equal(noise.affectedStocks.length, 0);

const meeting = analyze({
  ...base,
  headline: "Board meeting of Lucky Cement on 14 Oct 2026 to consider financial results",
});
assert.equal(meeting.affectedStocks.some((stock) => stock.ticker === "LUCK"), true);
assert.ok(meeting.dates.meetingDate);
assert.equal(meeting.eventType === "BOARD_MEETING" || meeting.eventType === "FINANCIAL_RESULT", true);

const profit = analyze({ ...base, headline: "PSO profit declined in the latest quarter" });
assert.equal(profit.affectedStocks.find((stock) => stock.ticker === "PSO")?.direction, "negative");

const foreignRate = analyze({
  ...base,
  headline: "Indian central bank hikes rates for first time since 2023",
  excerpt: "The Reserve Bank of India hiked interest rates and lends to commercial banks as the rupee weakened.",
});
assert.equal(foreignRate.relevance, "irrelevant");
assert.equal(foreignRate.affectedStocks.length, 0);

const rupee = analyze({ ...base, headline: "Rupee falls against the dollar" });
assert.equal(rupee.affectedStocks.some((stock) => stock.ticker === "NML" && stock.direction === "positive"), true);

const sbp = analyze({ ...base, headline: "SBP raises the policy rate" });
assert.equal(sbp.affectedStocks.some((stock) => stock.ticker === "MEBL" && stock.direction === "positive"), true);

console.log("engine checks passed");
