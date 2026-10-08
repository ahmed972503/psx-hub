import { ActionForm } from "@/components/action-form";
import { reviewAlertAction } from "@/server/actions";
import { prisma } from "@/server/db";

export default async function ReviewPage() {
  const reviews = await prisma.alertReview.findMany({
    where: { status: "PENDING" },
    include: { item: { include: { stockImpacts: { include: { company: true } } } } },
    orderBy: { createdAt: "desc" },
  });
  return (
    <div>
      <h1 className="text-2xl font-semibold">Alert review</h1>
      <div className="mt-4 space-y-4">
        {reviews.length === 0 ? <p className="text-sm text-muted">No high-impact alerts are waiting.</p> : reviews.map((review) => (
          <article key={review.id} className="card p-4 text-sm">
            <p className="font-semibold">{review.item.headline}</p>
            <p className="mt-1 text-muted">{review.item.stockImpacts.map((impact) => impact.company.ticker).join(", ")}</p>
            <ActionForm action={reviewAlertAction} className="mt-3 grid gap-2 md:grid-cols-2">
              <input type="hidden" name="id" value={review.id} />
              <select name="direction" defaultValue={review.item.direction}>
                <option>POSITIVE</option>
                <option>NEGATIVE</option>
                <option>NEUTRAL</option>
                <option>MIXED</option>
              </select>
              <input name="impactScore" type="number" min={0} max={100} defaultValue={review.item.impactScore} />
              <input name="confidence" type="number" min={0} max={100} defaultValue={review.item.confidence} />
              <input name="note" placeholder="Review note" />
              <button className="btn btn-gold" name="decision" value="approve" type="submit">Approve and alert</button>
              <button className="btn btn-ghost" name="decision" value="reject" type="submit">Reject alert</button>
            </ActionForm>
          </article>
        ))}
      </div>
    </div>
  );
}
