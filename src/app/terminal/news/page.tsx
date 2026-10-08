import Link from "next/link";
import { NewsCard } from "@/components/news-card";
import { listNews, newsSources } from "@/server/queries";

const directions = [
  ["POSITIVE", "Positive"],
  ["NEGATIVE", "Negative"],
  ["MIXED", "Mixed"],
  ["NEUTRAL", "Neutral"],
] as const;

export default async function NewsPage({ searchParams }: { searchParams: Promise<{ source?: string; direction?: string }> }) {
  const params = await searchParams;
  const source = params.source?.trim() ?? "";
  const direction = params.direction?.trim() ?? "";
  const [items, sources] = await Promise.all([
    listNews(40, { source, direction }),
    newsSources(),
  ]);
  const filtering = Boolean(source || direction);
  return (
    <div className="space-y-4">
      <header>
        <p className="kicker">Feed</p>
        <h1 className="mt-2 text-2xl font-semibold">Intelligence</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">Open a card for the case. Irrelevant stories stay in the raw archive.</p>
      </header>
      <form action="/terminal/news" className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <select name="source" defaultValue={source} aria-label="Source" className="sm:w-auto">
          <option value="">All sources</option>
          {sources.map((name) => <option key={name}>{name}</option>)}
        </select>
        <select name="direction" defaultValue={direction} aria-label="Direction" className="sm:w-auto">
          <option value="">Any direction</option>
          {directions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
        <button className="btn btn-ghost text-sm" type="submit">Filter</button>
        {filtering ? <Link href="/terminal/news" className="btn btn-ghost text-sm">Clear</Link> : null}
      </form>
      <p className="text-sm text-muted">{items.length === 0 ? "No stories match." : `${items.length} ${items.length === 1 ? "story" : "stories"}`}</p>
      {items.length === 0 ? <p className="empty">Nothing in this view. Clear the filter or wait for the next collection.</p> : items.map((item) => <NewsCard key={item.id} item={item} />)}
    </div>
  );
}
