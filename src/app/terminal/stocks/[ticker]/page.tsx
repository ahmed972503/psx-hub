import Link from "next/link";
import { notFound } from "next/navigation";
import { DirectionPill } from "@/components/news-card";
import { formatDay, formatWhen } from "@/lib/format";
import { getCompany } from "@/server/queries";
import { marketData } from "@/server/market";

export default async function StockPage({ params }: { params: Promise<{ ticker: string }> }) {
  const { ticker } = await params;
  const company = await getCompany(ticker);
  if (!company) notFound();
  const quote = await marketData.getQuote(company.ticker);
  return (
    <div className="space-y-6">
      <header>
        <p className="font-mono text-gold">{company.ticker}</p>
        <h1 className="text-3xl font-semibold">{company.name}</h1>
        <p className="text-muted"><Link href={`/terminal/sectors/${company.sector.slug}`}>{company.sector.name}</Link></p>
        <p className="mt-3 text-sm text-muted">{quote.reason}</p>
      </header>
      <section className="card p-4">
        <h2 className="font-semibold">Why is this stock moving?</h2>
        <p className="mt-2 text-sm text-muted">A move cannot be confirmed from market data because no licensed price feed is connected.</p>
        {company.impacts.length === 0 ? (
          <p className="mt-3">No confirmed public catalyst has been identified yet.</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {company.impacts.map((impact) => (
              <li key={impact.id}>
                <Link className="card block p-3" href={`/terminal/news/${impact.itemId}`}>
                  <p className="font-medium">{impact.item.headline}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <DirectionPill direction={impact.direction} />
                    <span className="pill">{impact.strength}/100</span>
                  </div>
                  <p className="mt-2 text-sm text-muted">{impact.reason}</p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
      <section>
        <h2 className="font-semibold">Exposure map</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {company.exposures.map((exposure) => (
            <li key={exposure.id} className="card p-3">
              <p>{exposure.factor.replaceAll("_", " ")} · weight {exposure.weight}</p>
              <p className="text-muted">{exposure.note}</p>
            </li>
          ))}
        </ul>
      </section>
      <section>
        <h2 className="font-semibold">Events and dividends</h2>
        {company.events.length === 0 && company.dividends.length === 0 ? <p className="empty mt-3">No dated events or dividends are stored for this name.</p> : null}
        {company.events.map((event) => (
          <p key={event.id} className="card mt-2 p-3 text-sm">{event.eventType.replaceAll("_", " ")} · {formatDay(event.eventDate ?? event.meetingDate)} · {formatWhen(event.announcementTime)}</p>
        ))}
        {company.dividends.map((dividend) => (
          <p key={dividend.id} className="card mt-2 p-3 text-sm">Dividend {dividend.percent ? `${dividend.percent}%` : "rate not stated"} · {formatDay(dividend.announcementDate)}</p>
        ))}
      </section>
      <section className="text-sm text-muted">
        Historical price reaction is unavailable until a licensed price history provider is connected.
      </section>
    </div>
  );
}
