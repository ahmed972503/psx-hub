import { getCurrentUser } from "@/server/auth";
import { getNews } from "@/server/queries";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Authentication required." }, { status: 401 });
  const { id } = await context.params;
  const item = await getNews(id);
  if (!item) return Response.json({ error: "Not found." }, { status: 404 });
  return Response.json(item);
}
