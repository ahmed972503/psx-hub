import Link from "next/link";

export function Mark({ href = "/", label = "Intelligence" }: { href?: string; label?: string }) {
  return (
    <Link href={href} className="flex items-center gap-2 font-mono text-sm text-gold">
      <span className="grid h-7 w-7 place-items-center rounded-md bg-gold text-[10px] font-bold tracking-tight text-[#1a1305]">PSX</span>
      {label}
    </Link>
  );
}

export function PublicFrame({
  children,
  width = "max-w-md",
  corner,
}: {
  children: React.ReactNode;
  width?: string;
  corner?: { href: string; label: string };
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-line/80">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
          <Mark />
          {corner ? <Link href={corner.href} className="text-sm text-muted hover:text-paper">{corner.label}</Link> : null}
        </div>
      </header>
      <main className={`mx-auto w-full flex-1 px-6 py-10 ${width}`}>{children}</main>
      <footer className="border-t border-line/80">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap gap-4 px-6 py-5 text-sm text-muted">
          <Link href="/privacy" className="hover:text-paper">Privacy</Link>
          <Link href="/terms" className="hover:text-paper">Terms</Link>
          <Link href="/contact" className="hover:text-paper">Contact</Link>
        </div>
      </footer>
    </div>
  );
}
