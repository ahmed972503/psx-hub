import { ActionForm } from "@/components/action-form";
import { approveAccessAction, rejectAccessAction } from "@/server/actions";
import { prisma } from "@/server/db";
import { formatWhen } from "@/lib/format";

export default async function AccessAdminPage({ searchParams }: { searchParams: Promise<{ invite?: string; notice?: string; mailed?: string }> }) {
  const params = await searchParams;
  const requests = await prisma.accessRequest.findMany({ orderBy: { requestedAt: "desc" }, take: 50 });
  return (
    <div>
      <h1 className="text-2xl font-semibold">Access requests</h1>
      {params.invite ? (
        <p className="mt-4 card p-4 text-sm">
          {params.mailed === "1"
            ? "The invitation email was sent. This copy of the link is shown once, in case the email is delayed."
            : "The invitation email was not sent. Copy this link and send it yourself. It is shown once."}{" "}
          <span className="break-all text-gold">{params.invite}</span>
        </p>
      ) : null}
      {params.notice === "already-active" ? <p className="mt-4 text-sm text-muted">That email already has a password. The account was marked approved.</p> : null}
      <div className="mt-4 space-y-4">
        {requests.map((request) => (
          <article key={request.id} className="card p-4 text-sm">
            <p className="font-semibold">{request.name} · {request.email}</p>
            <p className="text-muted">{request.status} · {formatWhen(request.requestedAt)} · {request.country} · {request.investorType}</p>
            <p className="mt-2">{request.reason}</p>
            {request.message ? <p className="mt-1 text-muted">{request.message}</p> : null}
            {request.status === "PENDING" ? (
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <ActionForm action={approveAccessAction} className="space-y-2">
                  <input type="hidden" name="id" value={request.id} />
                  <input name="note" placeholder="Admin note" />
                  <button className="btn btn-gold" type="submit">Approve</button>
                </ActionForm>
                <ActionForm action={rejectAccessAction} className="space-y-2">
                  <input type="hidden" name="id" value={request.id} />
                  <input name="note" placeholder="Reason" />
                  <button className="btn btn-ghost" type="submit">Reject</button>
                </ActionForm>
              </div>
            ) : null}
          </article>
        ))}
      </div>
    </div>
  );
}
