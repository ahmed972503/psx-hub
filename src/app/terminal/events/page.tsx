import Link from "next/link";
import { countdown, formatDay } from "@/lib/format";
import { listEvents } from "@/server/queries";

export default async function EventsPage() {
  const events = await listEvents();
  return (
    <div>
      <h1 className="text-2xl font-semibold">Corporate calendar</h1>
      <p className="mt-2 text-sm text-muted">Dates appear only when the source text contained them.</p>
      <div className="mt-4 space-y-3">
        {events.length === 0 ? <p className="empty">No corporate events extracted yet.</p> : events.map((event) => (
          <article key={event.id} className="card p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-mono text-gold">{event.company ? <Link href={`/terminal/stocks/${event.company.ticker}`}>{event.company.ticker}</Link> : "Unmapped"}</p>
                <h2 className="mt-1 font-semibold">{event.eventType.replaceAll("_", " ")}</h2>
                <p className="mt-1 text-sm text-muted">{event.title}</p>
              </div>
              <div className="text-right text-sm">
                <p>{formatDay(event.eventDate ?? event.meetingDate)}</p>
                <p className="text-muted">{countdown(event.eventDate ?? event.meetingDate)}</p>
                <p className="text-muted">Importance {event.importance}</p>
              </div>
            </div>
            {event.sourceUrl ? <a className="mt-3 inline-block text-sm text-gold" href={event.sourceUrl}>Source</a> : null}
          </article>
        ))}
      </div>
    </div>
  );
}
