import Link from "next/link";
import { searchAll } from "@/server/queries";

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const query = q.trim();
  const result = query.length >= 2 ? await searchAll(query) : null;
  const empty = result ? result.companies.length + result.news.length + result.events.length === 0 : false;
  return (
    <div>
      <p className="kicker">Lookup</p>
      <h1 className="mt-2 text-2xl font-semibold">Search</h1>
      <form className="mt-4" action="/terminal/search">
        <input name="q" defaultValue={q} placeholder="Ticker, company, or headline" aria-label="Search" autoFocus />
      </form>
      {result ? (
        empty ? <p className="empty mt-4">Nothing matched “{query}”.</p> : (
          <div className="mt-6 space-y-6">
            {result.companies.length > 0 ? (
              <section>
                <h2 className="font-semibold">Companies</h2>
                <div className="mt-2 space-y-2">
                  {result.companies.map((company) => (
                    <Link key={company.id} href={`/terminal/stocks/${company.ticker}`} className="card block p-3 text-sm">
                      <span className="font-mono text-gold">{company.ticker}</span> · {company.name}
                    </Link>
                  ))}
                </div>
              </section>
            ) : null}
            {result.news.length > 0 ? (
              <section>
                <h2 className="font-semibold">News</h2>
                <div className="mt-2 space-y-2">
                  {result.news.map((item) => (
                    <Link key={item.id} href={`/terminal/news/${item.id}`} className="card block p-3 text-sm">{item.headline}</Link>
                  ))}
                </div>
              </section>
            ) : null}
            {result.events.length > 0 ? (
              <section>
                <h2 className="font-semibold">Events</h2>
                <div className="mt-2 space-y-2">
                  {result.events.map((event) => (
                    <p key={event.id} className="card p-3 text-sm">{event.company?.ticker ?? "Unmapped"} · {event.title}</p>
                  ))}
                </div>
              </section>
            ) : null}
          </div>
        )
      ) : <p className="mt-4 text-sm text-muted">Type at least two characters.</p>}
    </div>
  );
}
