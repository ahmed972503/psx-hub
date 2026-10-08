import Link from "next/link";
import { Mark } from "@/components/public-frame";
import { NavLinks } from "@/components/nav-links";
import { requireStaff } from "@/server/auth";

const links: [string, string][] = [
  ["Overview", "/admin"],
  ["Access", "/admin/access"],
  ["Users", "/admin/users"],
  ["Sources", "/admin/sources"],
  ["Intake", "/admin/intake"],
  ["Review", "/admin/review"],
  ["Audit", "/admin/audit"],
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireStaff();
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-line bg-ink/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
          <Mark href="/admin" label="Admin" />
          <NavLinks links={links} layout="row" />
          <div className="ml-auto flex items-center gap-3 text-xs uppercase tracking-wide text-muted">
            <span>{user.role.replaceAll("_", " ")}</span>
            <Link href="/terminal" className="text-gold">Terminal</Link>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
