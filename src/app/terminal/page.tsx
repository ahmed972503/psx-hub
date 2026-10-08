import Link from "next/link";
import { NewsCard } from "@/components/news-card";
import { countdown, formatDay } from "@/lib/format";
import { requireUser } from "@/server/auth";
import { dashboardData } from "@/server/queries";
import { askPlatform } from "@/server/ask";
import { ActionForm } from "@/components/action-form";

async function askAction(formData: FormData) {
  "use server";
  const user = await requireUser();
  const question = String(formData.get("question") ?? "");
  const result = await askPlatform(question, user.id);
  return { results: [{ source: "Ask PSX", ok: true, message: `${result.answer} ${result.citations.map((item) => item.url).filter(Boolean).join(" ")}` }] };
}

export default async function DashboardPage() {
  const user = await requireUser();
  const data = await dashboardData(user.id);
  const toneClass = data.tone === "Bullish" ? "up" : data.tone === "Bearish" ? "down" : data.tone === "Mixed" ? "mix" : "text-paper";
  return (
    <div className="space-y-8">
      <section className="grid gap-4 md:grid-cols-3">
        <div className="card p-5 md:col-span-2">
          <p className="kicker">News tone</p>
          <h1 className={`mt-3 text-4xl font-semibold ${toneClass}`}>{data.tone}</h1>
          <p className="mt-2 text-sm leading-6 text-muted">Based on collected news only. Index, breadth, and volume are not connected.</p>
          <ul className="mt-4 space-y-2 text-sm leading-6">
            {data.reasons.length === 0 ? <li className="text-muted">No material items have been processed today.</li> : data.reasons.map((reason) => <li key={reason}>{reason}</li>)}
          </ul>
        </div>
        <div className="card p-5">
          <p className="kicker">Market data</p>
          <p className="mt-3 text-xl font-semibold">{data.index.name}</p>
          <p className="mt-2 text-sm leading-6 text-muted">{data.index.reason}</p>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold">Top names to watch</h2>
        <p className="mt-1 max-w-2xl text-sm leading-6 text-muted">Ranked from news and corporate events in the last 48 hours. Price and volume are excluded.</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {data.watchToday.length === 0 ? <p className="empty sm:col-span-2 lg:col-span-5">No ranked names yet.</p> : data.watchToday.map((stock) => (
            <Link key={stock.ticker} href={`/terminal/stocks/${stock.ticker}`} className="card p-4">
              <p className="font-mono text-lg text-gold">{stock.ticker}</p>
              <p className="mt-2 text-xs leading-5 text-muted">{stock.why}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.4fr_0.8fr]">
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">What changed today</h2>
          {data.today.length === 0 ? <p className="empty">No visible intelligence items yet. An admin can run collectors or paste a public headline.</p> : data.today.slice(0, 4).map((item) => <NewsCard key={item.id} item={item} />)}
        </div>
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Next 7 days</h2>
          {data.upcoming.length === 0 ? <p className="empty">No dated corporate events in the next 7 days.</p> : data.upcoming.map((event) => (
            <article key={event.id} className="card p-3 text-sm">
              <p className="font-mono text-gold">{event.company?.ticker ?? "Unmapped"}</p>
              <p className="mt-1">{event.eventType.replaceAll("_", " ")}</p>
              <p className="text-muted">{formatDay(event.eventDate ?? event.meetingDate)} · {countdown(event.eventDate ?? event.meetingDate)}</p>
            </article>
          ))}
          <ActionForm action={askAction} className="card p-3">
            <p className="text-sm font-semibold">Ask PSX</p>
            <p className="mb-2 text-xs text-muted">Answers use records already stored here.</p>
            <input name="question" placeholder="Why is MEBL in the archive?" />
            <button className="btn btn-ghost mt-2 w-full text-sm" type="submit">Ask</button>
          </ActionForm>
        </div>
      </section>
    </div>
  );
}
