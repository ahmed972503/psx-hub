"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function NavLinks({
  links,
  layout = "stack",
}: {
  links: [string, string][];
  layout?: "stack" | "row" | "dock";
}) {
  const pathname = usePathname();
  const navClass =
    layout === "stack" ? "mt-6 flex flex-col gap-1 text-sm" : layout === "dock" ? "grid grid-cols-5" : "flex flex-wrap gap-1 text-sm";

  return (
    <nav className={navClass}>
      {links.map(([label, href]) => {
        const active = href === "/terminal" || href === "/admin" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
        const itemClass =
          layout === "dock"
            ? `py-3 ${active ? "font-semibold text-gold" : "text-muted"}`
            : `rounded-lg px-3 py-2 ${active ? "bg-panel-2 text-gold" : "text-paper hover:bg-panel-2"}`;
        return (
          <Link key={href} href={href} className={itemClass} aria-current={active ? "page" : undefined}>
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
