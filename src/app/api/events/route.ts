import { getCurrentUser } from "@/server/auth";
import { listEvents } from "@/server/queries";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Authentication required." }, { status: 401 });
  return Response.json({ events: await listEvents() });
}
