import Link from "next/link";
import { ActionForm } from "@/components/action-form";
import { PublicFrame } from "@/components/public-frame";
import { loginAction } from "@/server/actions";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; reset?: string }> }) {
  const params = await searchParams;
  return (
    <PublicFrame corner={{ href: "/request-access", label: "Request access" }}>
      <p className="kicker">Approved accounts</p>
      <h1 className="mt-3 text-3xl font-semibold">Login</h1>
      <p className="mt-2 text-sm leading-6 text-muted">There is no public registration. Use the password from your invitation.</p>
      {params.reset ? <p className="mt-4 rounded-xl border border-up/30 bg-up/10 px-3 py-2 text-sm text-up">Password updated. Log in with the new password.</p> : null}
      <ActionForm action={loginAction} className="card mt-6 space-y-3 p-5">
        <input name="next" type="hidden" value={params.next ?? ""} />
        <label className="block text-sm text-muted">Email<input className="mt-1" name="email" type="email" required autoComplete="username" /></label>
        <label className="block text-sm text-muted">Password<input className="mt-1" name="password" type="password" required autoComplete="current-password" /></label>
        <button className="btn btn-gold w-full" type="submit">Login</button>
      </ActionForm>
      <Link href="/forgot-password" className="mt-4 inline-block text-sm text-muted hover:text-paper">Forgot password</Link>
    </PublicFrame>
  );
}
