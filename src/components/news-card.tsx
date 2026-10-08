import Link from "next/link";
import { formatWhen, titleCase } from "@/lib/format";

type Impact = {
  company: { ticker: string; sector: { name: string } };
};

export function DirectionPill({ direction }: { direction: string }) {
  const tone = direction.toLowerCase();
  return <span className={`pill pill-${tone}`}>{titleCase(direction)}</span>;
}

export function NewsCard({
  item,
}: {
  item: {
    id: string;
    headline: string;
    primarySource: string;
    publishedAt: Date | null;
    direction: string;
    impactScore: number;
    confidenceLabel: string;
    stockImpacts: Impact[];
  };
}) {
  const tone = item.direction.toLowerCase();
  const names = item.stockImpacts.slice(0, 4);
  const score = Math.max(0, Math.min(100, item.impactScore));
  return (
    <Link href={`/terminal/news/${item.id}`} className="card block p-4 transition hover:border-[#8d6a2e]">
      <div className="flex items-center justify-between gap-3 text-xs uppercase tracking-wide text-muted">
        <span>{item.primarySource}</span>
        <span>{formatWhen(item.publishedAt)}</span>
      </div>
      <h2 className="mt-2 text-lg font-semibold leading-snug">{item.headline}</h2>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <DirectionPill direction={item.direction} />
        <span className="pill">Confidence {item.confidenceLabel}</span>
      </div>
      <div className="mt-3">
        <div className="mb-1 flex items-center justify-between text-xs text-muted">
          <span>Impact strength</span>
          <span className="font-mono text-paper">{score}/100</span>
        </div>
        <div className="meter" aria-hidden="true">
          <span className={`meter-fill meter-${tone}`} style={{ width: `${score}%` }} />
        </div>
      </div>
      {names.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {names.map((impact) => (
            <span key={impact.company.ticker} className="pill font-mono" title={impact.company.sector.name}>
              {impact.company.ticker}
            </span>
          ))}
        </div>
      ) : null}
    </Link>
  );
}
