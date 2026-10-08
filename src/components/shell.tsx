import { logoutAction } from "@/server/actions";
import { isStaff } from "@/server/auth";
import type { Role } from "@prisma/client";
import { Mark } from "@/components/public-frame";
import { NavLinks } from "@/components/nav-links";
import Link from "next/link";

const links: [string, string][] = [
  ["Dashboard", "/terminal"],
  ["News", "/terminal/news"],
  ["Events", "/terminal/events"],
  ["Dividends", "/terminal/dividends"],
  ["Results", "/terminal/results"],
  ["Sectors", "/terminal/sectors"],
  ["Watchlist", "/terminal/watchlist"],
  ["Alerts", "/terminal/alerts"],
  ["Search", "/terminal/search"],
];

const dock: [string, string][] = [
  ["Home", "/terminal"],
  ["News", "/terminal/news"],
  ["Events", "/terminal/events"],
  ["Watch", "/terminal/watchlist"],
  ["Search", "/terminal/search"],
];

export function Shell({
  user,
  children,
}: {
  user: { name: string; email: string; role: Role };
  children: React.ReactNode;
}) {
  const nav = isStaff(user.role) ? [...links, ["Admin", "/admin"] as [string, string]] : links;
  return (
    <div className="min-h-screen md:grid md:grid-cols-[240px_1fr]">
      <aside className="sticky top-0 hidden h-screen flex-col justify-between border-r border-line bg-panel/80 p-4 md:flex">
        <div>
          <Mark href="/terminal" />
          <NavLinks links={nav} />
        </div>
        <div>
          <p className="truncate text-sm font-medium">{user.name}</p>
          <p className="mt-1 text-xs uppercase tracking-wide text-muted">{user.role.replaceAll("_", " ")}</p>
          <form action={logoutAction} className="mt-3">
            <button className="btn btn-ghost w-full text-sm" type="submit">Log out</button>
          </form>
        </div>
      </aside>
      <div className="min-w-0 pb-20 md:pb-0">
        <header className="flex items-center gap-3 border-b border-line px-4 py-3 md:px-6">
          <p className="truncate text-sm text-muted md:hidden">{user.name}</p>
          <form action="/terminal/search" className="hidden min-w-0 flex-1 md:block">
            <input name="q" placeholder="Search a ticker, company, or headline" className="max-w-md py-2" aria-label="Search" />
          </form>
          <Link href="/terminal/settings" className="ml-auto text-sm text-gold">Settings</Link>
        </header>
        <main className="mx-auto w-full max-w-6xl px-4 py-6 md:px-6">{children}</main>
      </div>
      <div className="fixed inset-x-0 bottom-0 border-t border-line bg-ink/95 text-center text-xs backdrop-blur md:hidden">
        <NavLinks links={dock} layout="dock" />
      </div>
    </div>
  );
}
