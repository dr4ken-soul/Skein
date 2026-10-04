"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/app/check", label: "Check" },
  { href: "/app/pledges", label: "My pledges" },
  { href: "/registry", label: "Registry" },
  { href: "/", label: "Landing" },
];

export function AppRail() {
  const pathname = usePathname();
  return (
    <>
      <aside className="hidden lg:flex flex-col gap-1 w-56 shrink-0 p-4 border-r min-h-screen" style={{ borderColor: "var(--border)" }}>
        <Link href="/" className="font-serif text-lg mb-4">Skein</Link>
        {NAV.map((n) => (
          <Link key={n.href} href={n.href} className={`px-3 py-2 rounded-lg text-sm ${pathname === n.href ? "bg-[var(--bg-secondary)] font-medium" : "hover:bg-[var(--bg-secondary)]"}`}>
            {n.label}
          </Link>
        ))}
      </aside>
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 flex items-center justify-around border-t bg-[var(--bg-primary)] py-2" style={{ borderColor: "var(--border)" }}>
        {NAV.slice(0, 3).map((n) => (
          <Link key={n.href} href={n.href} className={`px-3 py-2 text-sm ${pathname === n.href ? "font-medium" : ""}`}>{n.label}</Link>
        ))}
      </nav>
    </>
  );
}
