"use client";

import Link from "next/link";
import { useActionState } from "react";
import { PublicFrame } from "@/components/public-frame";
import { forgotPasswordAction } from "@/server/actions";

export default function ForgotPasswordPage() {
  const [state, action] = useActionState(async (_previous: { message?: string; devLink?: string; error?: string } | null, formData: FormData) => {
    return forgotPasswordAction(formData);
  }, null);
  return (
    <PublicFrame corner={{ href: "/login", label: "Back to login" }}>
      <p className="kicker">Account</p>
      <h1 className="mt-3 text-3xl font-semibold">Reset password</h1>
      <p className="mt-2 text-sm leading-6 text-muted">If the account is active, a reset email is sent. The link expires in one hour.</p>
      <form action={action} className="card mt-6 space-y-3 p-5">
        {state?.error ? <p className="text-sm text-down">{state.error}</p> : null}
        {state?.message ? <p className="text-sm leading-6 text-muted">{state.message}</p> : null}
        {state?.devLink ? <p className="break-all text-sm">Reset link: <Link className="text-gold" href={state.devLink}>{state.devLink}</Link></p> : null}
        <label className="block text-sm text-muted">Email<input className="mt-1" name="email" type="email" required /></label>
        <button className="btn btn-gold w-full" type="submit">Send reset email</button>
      </form>
    </PublicFrame>
  );
}
