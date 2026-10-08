import { getCurrentUser } from "@/server/auth";
import { getCompany } from "@/server/queries";
import { marketData } from "@/server/market";

export async function GET(_request: Request, context: { params: Promise<{ ticker: string }> }) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Authentication required." }, { status: 401 });
  const { ticker } = await context.params;
  const company = await getCompany(ticker);
  if (!company) return Response.json({ error: "Not found." }, { status: 404 });
  return Response.json({ company, quote: await marketData.getQuote(company.ticker) });
}
