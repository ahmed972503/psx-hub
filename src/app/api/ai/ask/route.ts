import { askPlatform } from "@/server/ask";
import { getCurrentUser } from "@/server/auth";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Authentication required." }, { status: 401 });
  const body = await request.json().catch(() => null) as { question?: string } | null;
  const result = await askPlatform(String(body?.question ?? ""), user.id);
  return Response.json(result);
}
