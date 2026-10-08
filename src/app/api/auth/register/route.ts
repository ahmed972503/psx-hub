export async function POST() {
  return Response.json({ error: "Registration is closed. Request access instead." }, { status: 403 });
}
