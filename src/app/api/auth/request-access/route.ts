import { requestAccessAction } from "@/server/actions";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as Record<string, string> | null;
  const formData = new FormData();
  for (const [key, value] of Object.entries(body ?? {})) formData.set(key, value ?? "");
  try {
    const result = await requestAccessAction(formData);
    if (result && "error" in result) return Response.json(result, { status: 400 });
    return Response.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && error.message === "NEXT_REDIRECT") throw error;
    return Response.json({ ok: true });
  }
}
