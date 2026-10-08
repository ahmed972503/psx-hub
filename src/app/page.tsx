import Link from "next/link";
import { Mark } from "@/components/public-frame";

const steps = [
  ["1 · Source", "A public headline, its time, and a link back to the original."],
  ["2 · Names", "A company or sector only when the text supports the mapping."],
  ["3 · Case", "Direction, strength, confidence, and the reason behind them."],
];

const points = [
  ["News desk", "Dawn Business is collected, clustered, and scored. Irrelevant stories stay out of the feed."],
  ["Corporate calendar", "Dividends, results, and meetings appear only when a date or figure was in the source."],
  ["Approval gate", "Access is requested, then approved. Invitations and password resets go out by email."],
];

export default function Home() {
  return (
    <div className="min-h-screen">
      <header className="border-b border-line/80">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Mark />
          <Link href="/login" className="btn btn-ghost text-sm">Login</Link>
        </div>
      </header>
      <main className="mx-auto grid max-w-6xl items-center gap-10 px-6 py-12 lg:grid-cols-[1.15fr_0.85fr] lg:py-16">
        <section>
          <p className="kicker">Private access</p>
          <h1 className="mt-4 max-w-3xl text-4xl font-semibold leading-[1.08] md:text-6xl">
            What happened, which PSX names it touches, and how strong the case is.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">
            Approved traders get one desk for public news, company announcements, dividends, results, and a rules-based impact map. This is not a price forecast.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/request-access" className="btn btn-gold">Request access</Link>
            <Link href="/login" className="btn btn-ghost">Login</Link>
          </div>
        </section>
        <aside className="card overflow-hidden">
          <p className="border-b border-line px-5 py-3 text-xs uppercase tracking-[0.16em] text-muted">How a story is read</p>
          <ol>
            {steps.map(([title, body]) => (
              <li key={title} className="border-b border-line px-5 py-4 last:border-b-0">
                <p className="text-xs uppercase tracking-wide text-gold">{title}</p>
                <p className="mt-1 text-sm leading-6 text-paper">{body}</p>
              </li>
            ))}
          </ol>
        </aside>
      </main>
      <section className="mx-auto grid max-w-6xl gap-3 px-6 pb-16 md:grid-cols-3">
        {points.map(([title, body]) => (
          <article key={title} className="card p-5">
            <h2 className="font-semibold">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-muted">{body}</p>
          </article>
        ))}
      </section>
      <footer className="border-t border-line/80">
        <div className="mx-auto flex max-w-6xl flex-wrap gap-4 px-6 py-5 text-sm text-muted">
          <Link href="/privacy" className="hover:text-paper">Privacy</Link>
          <Link href="/terms" className="hover:text-paper">Terms</Link>
          <Link href="/contact" className="hover:text-paper">Contact</Link>
        </div>
      </footer>
    </div>
  );
}
