import Link from "next/link";
import { prisma } from "@/server/db";

export default async function SectorsPage() {
  const sectors = await prisma.sector.findMany({ orderBy: { name: "asc" }, include: { _count: { select: { companies: true } } } });
  return (
    <div>
      <h1 className="text-2xl font-semibold">Sectors</h1>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {sectors.map((sector) => (
          <Link key={sector.id} href={`/terminal/sectors/${sector.slug}`} className="card p-4">
            <p className="font-semibold">{sector.name}</p>
            <p className="mt-1 text-sm text-muted">{sector.summary}</p>
            <p className="mt-2 text-xs text-muted">{sector._count.companies} mapped companies</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
