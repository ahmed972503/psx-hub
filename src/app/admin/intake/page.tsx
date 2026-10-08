import { ActionForm } from "@/components/action-form";
import { intakeAction } from "@/server/actions";
import { prisma } from "@/server/db";

export default async function IntakePage({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  const params = await searchParams;
  const sources = await prisma.source.findMany({ orderBy: { name: "asc" } });
  return (
    <div>
      <h1 className="text-2xl font-semibold">Manual intake</h1>
      <p className="mt-2 text-sm text-muted">Paste a headline, the original URL, and at most a short excerpt. Do not paste a full article.</p>
      {params.saved ? <p className="mt-3 text-sm text-up">Item stored and run through the impact engine.</p> : null}
      <ActionForm action={intakeAction} className="mt-4 space-y-3">
        <select name="sourceId" defaultValue={sources.find((source) => source.type === "MANUAL")?.id}>
          {sources.map((source) => <option key={source.id} value={source.id}>{source.name}</option>)}
        </select>
        <input name="headline" placeholder="Headline" required />
        <input name="url" placeholder="https://original-source.example/story" required />
        <input name="publishedAt" type="datetime-local" />
        <textarea name="excerpt" maxLength={320} rows={4} placeholder="Short permitted excerpt, optional" />
        <button className="btn btn-gold" type="submit">Process item</button>
      </ActionForm>
    </div>
  );
}
