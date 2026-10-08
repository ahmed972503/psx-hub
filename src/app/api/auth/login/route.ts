import { loginWithPassword } from "@/server/auth";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as { email?: string; password?: string } | null;
  const result = await loginWithPassword(String(body?.email ?? ""), String(body?.password ?? ""));
  if (!result.ok) return Response.json({ error: result.error }, { status: 401 });
  return Response.json({ ok: true });
}
