import { clearSession } from "@/server/auth";

export async function POST() {
  await clearSession();
  return Response.json({ ok: true });
}
