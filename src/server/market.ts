export type Quote = {
  ticker: string;
  available: false;
  price: null;
  change: null;
  asOf: null;
  reason: string;
};

const REASON = "No licensed market-data provider is connected. Prices, volume, and index levels are not shown.";

export const marketData = {
  id: "none",
  name: "No licensed provider",
  async getQuote(ticker: string): Promise<Quote> {
    return { ticker, available: false, price: null, change: null, asOf: null, reason: REASON };
  },
  async getIndex() {
    return { name: "KSE-100", available: false as const, reason: REASON };
  },
};
