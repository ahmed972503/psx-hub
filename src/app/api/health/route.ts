import { prisma } from "@/server/db";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return Response.json({ database: "ok", marketData: "not_connected", collector: process.env.ENABLE_COLLECTOR === "true" ? "enabled" : "disabled" });
  } catch {
    return Response.json({ database: "error" }, { status: 503 });
  }
}
