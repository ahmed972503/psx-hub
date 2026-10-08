import Link from "next/link";
import { formatDay } from "@/lib/format";
import { listDividends } from "@/server/queries";

export default async function DividendsPage() {
  const dividends = await listDividends();
  return (
    <div>
      <h1 className="text-2xl font-semibold">Dividend center</h1>
      <p className="mt-2 text-sm text-muted">A blank rate means the source text did not state one. Yield needs a licensed price, so it is not shown.</p>
      <div className="mt-4 space-y-3">
        {dividends.length === 0 ? <p className="text-sm text-muted">No dividends extracted yet.</p> : dividends.map((dividend) => (
          <article key={dividend.id} className="card p-4 text-sm">
            <p className="font-mono text-gold"><Link href={`/terminal/stocks/${dividend.company.ticker}`}>{dividend.company.ticker}</Link> · {dividend.company.name}</p>
            <p className="mt-2">{dividend.percent ? `${dividend.percent}%` : "Rate not stated"}{dividend.perShare ? ` · Rs ${dividend.perShare} per share` : ""}</p>
            <p className="mt-1 text-muted">Announced {formatDay(dividend.announcementDate)}</p>
            <p className="text-muted">Book closure {formatDay(dividend.bookClosureStart)} to {formatDay(dividend.bookClosureEnd)}</p>
            <p className="text-muted">Payment {formatDay(dividend.paymentDate)}</p>
            {dividend.notes ? <p className="mt-2 text-muted">{dividend.notes}</p> : null}
          </article>
        ))}
      </div>
    </div>
  );
}
