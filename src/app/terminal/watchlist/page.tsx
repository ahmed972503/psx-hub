import { ActionForm } from "@/components/action-form";
import { addWatchAction, removeWatchAction } from "@/server/actions";
import { requireUser } from "@/server/auth";
import { prisma } from "@/server/db";
import { marketData } from "@/server/market";

export default async function WatchlistPage() {
  const user = await requireUser();
  const saved = await prisma.watchlistItem.findMany({
    where: { userId: user.id },
    include: { company: { include: { sector: true } } },
    orderBy: { createdAt: "desc" },
  });
  const items = await Promise.all(saved.map(async (item) => ({
    item,
    quote: await marketData.getQuote(item.company.ticker),
  })));
  return (
    <div>
      <h1 className="text-2xl font-semibold">My watchlist</h1>
      <ActionForm action={addWatchAction} className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
        <input name="ticker" placeholder="Ticker, for example MEBL" className="sm:max-w-xs" />
        <button className="btn btn-gold" type="submit">Add</button>
      </ActionForm>
      <div className="mt-4 space-y-3">
        {items.length === 0 ? <p className="empty">No names saved yet.</p> : items.map(({ item, quote }) => (
          <article key={item.id} className="card flex items-start justify-between gap-3 p-4">
            <div>
              <p className="font-mono text-gold">{item.company.ticker}</p>
              <p>{item.company.name}</p>
              <p className="text-sm text-muted">{item.company.sector.name}</p>
              <p className="mt-2 text-sm text-muted">{quote.reason}</p>
            </div>
            <form action={removeWatchAction}>
              <input type="hidden" name="id" value={item.id} />
              <button className="text-sm text-muted" type="submit">Remove</button>
            </form>
          </article>
        ))}
      </div>
    </div>
  );
}
