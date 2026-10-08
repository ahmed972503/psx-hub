import { ActionForm, SubmitButton } from "@/components/action-form";
import { collectAction, saveSourceAction, toggleSourceAction } from "@/server/actions";
import { prisma } from "@/server/db";
import { formatWhen } from "@/lib/format";

export default async function SourcesPage() {
  const sources = await prisma.source.findMany({ orderBy: { name: "asc" } });
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="kicker">Collection</p>
          <h1 className="mt-2 text-2xl font-semibold">Sources</h1>
        </div>
        <ActionForm action={collectAction}>
          <SubmitButton className="btn btn-gold" pendingLabel="Collecting…">Run collectors</SubmitButton>
        </ActionForm>
      </div>
      {sources.map((source) => (
        <article key={source.id} className="card p-4 text-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold">{source.name}</p>
                <span className={source.enabled ? "pill pill-positive" : "pill"}>{source.enabled ? "Collecting" : "Off"}</span>
              </div>
              <p className="mt-1 text-muted">{source.type} · reliability {source.reliability} · {source.articleCount} stored</p>
              {source.url ? <p className="mt-1 break-all text-muted">{source.url}</p> : null}
              <p className="mt-1 text-muted">{source.lastSuccessAt ? `Last collected ${formatWhen(source.lastSuccessAt)}` : "Not collected yet"}</p>
              {source.lastError ? <p className="mt-1 text-down">Last error: {source.lastError}</p> : null}
            </div>
            <ActionForm action={toggleSourceAction}>
              <input type="hidden" name="id" value={source.id} />
              <SubmitButton className="btn btn-ghost text-sm" pendingLabel="Saving…">{source.enabled ? "Turn off" : "Turn on"}</SubmitButton>
            </ActionForm>
          </div>
        </article>
      ))}
      <ActionForm action={saveSourceAction} className="card space-y-3 p-4">
        <h2 className="font-semibold">Add source</h2>
        <p className="text-sm leading-6 text-muted">Only an RSS address is fetched on its own. Other types stay on file until an analyst pastes a headline and its original URL.</p>
        <label className="block text-sm text-muted">Name<input className="mt-1" name="name" placeholder="Business Recorder" required /></label>
        <label className="block text-sm text-muted">Type
          <select className="mt-1" name="type" defaultValue="RSS">
            <option>RSS</option>
            <option>HTML</option>
            <option>OFFICIAL</option>
            <option>API</option>
            <option>SITEMAP</option>
            <option>MANUAL</option>
          </select>
        </label>
        <label className="block text-sm text-muted">Feed URL<input className="mt-1" name="url" placeholder="https://example.com/feed" /></label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm text-muted">Category<input className="mt-1" name="category" defaultValue="business_news" /></label>
          <label className="block text-sm text-muted">Language<input className="mt-1" name="language" defaultValue="en" /></label>
          <label className="block text-sm text-muted">Reliability, 0–100<input className="mt-1" name="reliability" type="number" min={0} max={100} defaultValue={60} /></label>
          <label className="block text-sm text-muted">Poll every, seconds<input className="mt-1" name="pollIntervalSec" type="number" min={120} defaultValue={900} /></label>
        </div>
        <label className="flex items-center gap-2 text-sm text-paper">
          <input name="enabled" type="checkbox" defaultChecked />
          Start collecting as soon as this is saved
        </label>
        <label className="block text-sm text-muted">Notes<textarea className="mt-1" name="notes" rows={3} placeholder="What this source is allowed to store" /></label>
        <SubmitButton className="btn btn-gold" pendingLabel="Saving…">Save source</SubmitButton>
      </ActionForm>
    </div>
  );
}
