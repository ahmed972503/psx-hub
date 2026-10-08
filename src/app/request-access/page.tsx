import { ActionForm } from "@/components/action-form";
import { PublicFrame } from "@/components/public-frame";
import { requestAccessAction } from "@/server/actions";

export default async function RequestAccessPage({ searchParams }: { searchParams: Promise<{ sent?: string }> }) {
  const params = await searchParams;
  return (
    <PublicFrame width="max-w-xl" corner={{ href: "/login", label: "Login" }}>
      <p className="kicker">Private desk</p>
      <h1 className="mt-3 text-3xl font-semibold">Request access</h1>
      <p className="mt-2 text-sm leading-6 text-muted">An administrator reviews the request. Approval sends an invitation email.</p>
      {params.sent ? (
        <p className="card mt-6 p-5 text-sm leading-6">Your request is saved. If it is approved, the invitation is emailed. The link expires in 7 days.</p>
      ) : (
        <ActionForm action={requestAccessAction} className="card mt-6 space-y-3 p-5">
          <label className="block text-sm text-muted">Full name<input className="mt-1" name="name" required /></label>
          <label className="block text-sm text-muted">Email<input className="mt-1" name="email" type="email" required /></label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm text-muted">Phone, optional<input className="mt-1" name="phone" /></label>
            <label className="block text-sm text-muted">Username, optional<input className="mt-1" name="requestedUsername" /></label>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm text-muted">Investor or trader type
              <select className="mt-1" name="investorType" defaultValue="Investor">
                <option>Trader</option>
                <option>Investor</option>
                <option>Analyst</option>
                <option>Institution</option>
                <option>Other</option>
              </select>
            </label>
            <label className="block text-sm text-muted">Country<input className="mt-1" name="country" defaultValue="Pakistan" required /></label>
          </div>
          <label className="block text-sm text-muted">Reason for requesting access<textarea className="mt-1" name="reason" rows={4} required /></label>
          <label className="block text-sm text-muted">Optional message<textarea className="mt-1" name="message" rows={3} /></label>
          <button className="btn btn-gold w-full" type="submit">Submit request</button>
        </ActionForm>
      )}
    </PublicFrame>
  );
}
