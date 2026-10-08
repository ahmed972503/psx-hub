import { markAlertReadAction } from "@/server/actions";
import { requireUser } from "@/server/auth";
import { prisma } from "@/server/db";
import { formatWhen } from "@/lib/format";
import Link from "next/link";

export default async function AlertsPage() {
  const user = await requireUser();
  const alerts = await prisma.alert.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { item: true },
  });
  return (
    <div>
      <h1 className="text-2xl font-semibold">Alerts</h1>
      <p className="mt-2 text-sm text-muted">Alerts stay on this site. High-impact items can wait for analyst review before they appear here.</p>
      <div className="mt-4 space-y-3">
        {alerts.length === 0 ? <p className="empty">No alerts yet. Add a watchlist name, then process a matching item.</p> : alerts.map((alert) => (
          <article key={alert.id} className="card p-4">
            <p className="text-xs uppercase text-muted">{alert.priority} · {formatWhen(alert.createdAt)}</p>
            <h2 className="mt-1 font-semibold">{alert.title}</h2>
            <p className="mt-2 text-sm text-muted">{alert.body}</p>
            <div className="mt-3 flex gap-4 text-sm">
              <Link className="text-gold" href={`/terminal/news/${alert.itemId}`}>View analysis</Link>
              {alert.readAt ? null : (
                <form action={markAlertReadAction}>
                  <input type="hidden" name="id" value={alert.id} />
                  <button className="text-sm text-gold" type="submit">Mark read</button>
                </form>
              )}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
