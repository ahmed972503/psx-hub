import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/server/db";

export default async function SectorPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const sector = await prisma.sector.findUnique({
    where: { slug },
    include: {
      companies: { orderBy: { ticker: "asc" } },
      impacts: { include: { item: true }, orderBy: { item: { processedAt: "desc" } }, take: 8 },
    },
  });
  if (!sector) notFound();
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-semibold">{sector.name}</h1>
        <p className="mt-2 text-muted">{sector.summary}</p>
      </header>
      <section className="grid gap-2 md:grid-cols-2">
        {sector.companies.map((company) => (
          <Link key={company.id} href={`/terminal/stocks/${company.ticker}`} className="card p-3 text-sm">
            <span className="font-mono text-gold">{company.ticker}</span> {company.name}
          </Link>
        ))}
      </section>
      <section>
        <h2 className="font-semibold">Latest mapped news</h2>
        {sector.impacts.length === 0 ? <p className="mt-2 text-sm text-muted">No sector-linked items yet.</p> : sector.impacts.map((impact) => (
          <p key={impact.id} className="mt-2 text-sm">
            <Link className="text-gold" href={`/terminal/news/${impact.itemId}`}>{impact.item.headline}</Link>
          </p>
        ))}
      </section>
    </div>
  );
}
