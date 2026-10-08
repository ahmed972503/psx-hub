import { ActionForm } from "@/components/action-form";
import { PublicFrame } from "@/components/public-frame";
import { acceptInviteAction } from "@/server/actions";

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return (
    <PublicFrame>
      <p className="kicker">Invitation</p>
      <h1 className="mt-3 text-3xl font-semibold">Set your password</h1>
      <p className="mt-2 text-sm leading-6 text-muted">Use at least 10 characters, with a letter and a number. This link works once.</p>
      <ActionForm action={acceptInviteAction} className="card mt-6 space-y-3 p-5">
        <input type="hidden" name="token" value={token} />
        <label className="block text-sm text-muted">Password<input className="mt-1" name="password" type="password" required minLength={10} autoComplete="new-password" /></label>
        <button className="btn btn-gold w-full" type="submit">Activate account</button>
      </ActionForm>
    </PublicFrame>
  );
}
