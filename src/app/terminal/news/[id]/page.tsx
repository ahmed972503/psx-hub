import Link from "next/link";
import { notFound } from "next/navigation";
import { DirectionPill } from "@/components/news-card";
import { formatWhen } from "@/lib/format";
import { getNews } from "@/server/queries";

export default async function ArticlePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ lang?: string }>;
}) {
  const { id } = await params;
  const { lang } = await searchParams;
  const item = await getNews(id);
  if (!item) notFound();
  const simple = lang === "ur" ? item.simpleUr : lang === "roman" ? item.simpleRoman : item.simpleEn;
  const risks = Array.isArray(item.risks) ? item.risks.filter((risk): risk is string => typeof risk === "string") : [];
  return (
    <article className="space-y-6">
      <Link href="/terminal/news" className="text-sm text-gold">Back to feed</Link>
      <header>
        <p className="text-xs uppercase tracking-wide text-muted">{item.primarySource} · {item.verification.replaceAll("_", " ").toLowerCase()}</p>
        <h1 className="mt-2 text-3xl font-semibold leading-tight">{item.headline}</h1>
        <p className="mt-2 text-sm text-muted">Published {formatWhen(item.publishedAt)} · Processed {formatWhen(item.processedAt)}</p>
        <a className="mt-3 inline-block text-sm text-gold" href={item.primaryUrl} target="_blank" rel="noreferrer">Open original source</a>
      </header>
      <section className="card p-4">
        <h2 className="text-sm uppercase tracking-wide text-muted">Fact</h2>
        <p className="mt-2">{item.fact}</p>
      </section>
      <section className="card p-4">
        <h2 className="text-sm uppercase tracking-wide text-muted">Interpretation</h2>
        <p className="mt-2 text-sm text-muted">Rules and exposure map. No generative model was called.</p>
        <p className="mt-2">{item.interpretation}</p>
      </section>
      <section className="card p-4">
        <h2 className="text-sm uppercase tracking-wide text-muted">Possible market impact</h2>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <DirectionPill direction={item.direction} />
          <span className="pill">{item.impactScore}/100</span>
          <span className="pill">{item.confidenceLabel} confidence</span>
        </div>
        <p className="mt-2">{item.possibleImpact}</p>
        <p className="mt-2 text-sm text-muted">Horizon: {item.timeHorizon.replaceAll("_", " ")}. Relationship: {item.relationship}.</p>
      </section>
      <section>
        <h2 className="text-lg font-semibold">Affected stocks</h2>
        <div className="mt-3 space-y-3">
          {item.stockImpacts.length === 0 ? <p className="text-sm text-muted">No confirmed company mapping.</p> : item.stockImpacts.map((impact) => (
            <Link key={impact.id} href={`/terminal/stocks/${impact.company.ticker}`} className="card block p-3">
              <p className="font-mono text-gold">{impact.company.ticker} · {impact.direction.toLowerCase()} · {impact.strength}/100</p>
              <p className="mt-1 text-sm text-muted">{impact.relationship} · {impact.reason}</p>
            </Link>
          ))}
        </div>
      </section>
      <section className="card p-4">
        <div className="flex flex-wrap gap-2 text-sm">
          {[
            ["English", ""],
            ["Urdu", "ur"],
            ["Roman Urdu", "roman"],
          ].map(([label, code]) => {
            const active = (lang ?? "") === code;
            return (
              <Link key={label} href={code ? `/terminal/news/${item.id}?lang=${code}` : `/terminal/news/${item.id}`} className={active ? "pill pill-mixed" : "pill"} aria-current={active ? "page" : undefined}>
                {label}
              </Link>
            );
          })}
        </div>
        <h2 className="mt-4 font-semibold">Explain in simple words</h2>
        <p className="mt-2 text-sm" dir={lang === "ur" ? "rtl" : "ltr"}>{simple}</p>
      </section>
      {item.cluster.rawNews.length > 1 ? (
        <section>
          <h2 className="font-semibold">Multiple sources</h2>
          <ul className="mt-2 space-y-1 text-sm">
            {item.cluster.rawNews.map((raw) => (
              <li key={raw.id}><a className="text-gold" href={raw.sourceUrl}>{raw.source.name}</a></li>
            ))}
          </ul>
        </section>
      ) : null}
      <section>
        <h2 className="font-semibold">Limits</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted">
          {risks.map((risk) => <li key={risk}>{risk}</li>)}
        </ul>
      </section>
    </article>
  );
}
