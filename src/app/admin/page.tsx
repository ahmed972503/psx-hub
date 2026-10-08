import { mailSettings } from "@/server/mail";
import { adminOverview } from "@/server/queries";

export default async function AdminHome() {
  const stats = await adminOverview();
  const mail = mailSettings();
  const cards = [
    ["Active users", stats.users],
    ["Pending requests", stats.pending],
    ["Raw items today", stats.newsToday],
    ["Visible items today", stats.visibleToday],
    ["Events today", stats.events],
    ["Alerts today", stats.alerts],
    ["Sources with errors", stats.failedSources],
    ["Alert review queue", stats.queue],
  ];
  return (
    <div>
      <p className="kicker">Operations</p>
      <h1 className="mt-2 text-2xl font-semibold">System</h1>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map(([label, value]) => (
          <article key={String(label)} className="card p-4">
            <p className="text-xs uppercase tracking-wide text-muted">{label}</p>
            <p className="mt-2 font-mono text-3xl font-semibold">{value}</p>
          </article>
        ))}
      </div>
      <p className={`mt-6 card border-l-4 p-4 text-sm leading-6 ${mail ? "border-l-up" : "border-l-down"}`}>
        {mail ? `Email is ready through ${mail.host} as ${mail.from}.` : "Email is not configured. Add the SMTP values in .env and restart the app."}
      </p>
    </div>
  );
}
