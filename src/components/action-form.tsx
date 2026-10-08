"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

type Result = { source: string; ok: boolean; message: string };
type State = { error?: string; results?: Result[] } | null;

export function ActionForm({
  action,
  children,
  className,
}: {
  action: (formData: FormData) => Promise<{ error?: string; results?: Result[] } | void>;
  children: React.ReactNode;
  className?: string;
}) {
  const [state, formAction, pending] = useActionState(async (_previous: State, formData: FormData) => {
    const result = await action(formData);
    if (!result) return null;
    if (result.error) return { error: result.error };
    if (result.results) return { results: result.results };
    return null;
  }, null);

  return (
    <form action={formAction} className={className}>
      {state?.error ? <p className="mb-3 text-sm text-down">{state.error}</p> : null}
      {state?.results ? (
        <ul className="mb-3 space-y-1 text-sm text-muted">
          {state.results.map((row) => (
            <li key={row.source}>
              {row.source}: {row.message}
            </li>
          ))}
        </ul>
      ) : null}
      <div className={pending ? "pointer-events-none opacity-70" : undefined}>{children}</div>
    </form>
  );
}

export function SubmitButton({
  children,
  pendingLabel,
  className,
}: {
  children: React.ReactNode;
  pendingLabel: string;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button className={className} type="submit" disabled={pending} aria-busy={pending}>
      {pending ? pendingLabel : children}
    </button>
  );
}
