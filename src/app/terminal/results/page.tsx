import Link from "next/link";
import { formatWhen } from "@/lib/format";
import { listResults } from "@/server/queries";

export default async function ResultsPage() {
  const results = await listResults();
  return (
    <div>
      <h1 className="text-2xl font-semibold">Results</h1>
      <p className="mt-2 text-sm text-muted">Only figures written in the source are stored. Expected EPS is not invented.</p>
      <div className="mt-4 space-y-3">
        {results.length === 0 ? <p className="text-sm text-muted">No parsed results yet.</p> : results.map((result) => {
          const figures = Array.isArray(result.figures) ? result.figures : [];
          return (
            <article key={result.id} className="card p-4">
              <p className="font-mono text-gold"><Link href={`/terminal/stocks/${result.company.ticker}`}>{result.company.ticker}</Link></p>
              <p className="mt-2 text-sm">{result.summary}</p>
              <ul className="mt-2 text-sm text-muted">
                {figures.map((figure, index) => {
                  const row = figure as { label?: string; value?: string };
                  return <li key={`${result.id}-${index}`}>{row.label}: {row.value}</li>;
                })}
              </ul>
              <p className="mt-2 text-xs text-muted">{formatWhen(result.publishedAt)}</p>
            </article>
          );
        })}
      </div>
    </div>
  );
}
