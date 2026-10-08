import { getCurrentUser } from "@/server/auth";
import { marketData } from "@/server/market";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Authentication required." }, { status: 401 });
  return Response.json(await marketData.getIndex());
}
