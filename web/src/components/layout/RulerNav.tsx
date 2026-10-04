"use client";
import { useScrollProgress } from "@/hooks/useScrollProgress";

/** B1 scroll-progress line nav, fixed top. */
export function RulerNav() {
  const progress = useScrollProgress();
  return (
    <header className="fixed top-0 inset-x-0 z-[100] pointer-events-none">
      <div className="h-[2px] bg-[var(--accent)] origin-left transition-none" style={{ transform: `scaleX(${progress})` }} />
      <nav className="pointer-events-auto max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
        <a href="/" className="flex items-center gap-2">
          {/* Logo slot: replace with public/logo.svg once provided */}
          <span className="font-serif text-lg font-normal tracking-tight" style={{ color: "var(--text-primary)" }}>Skein</span>
        </a>
        <div className="flex items-center gap-3 text-sm">
          <a href="/registry" className="px-3 py-1.5 rounded-full border hover:bg-[var(--bg-tertiary)] transition-colors" style={{ borderColor: "var(--border)" }}>Registry</a>
          <a href="/app/check" className="px-4 py-1.5 rounded-full text-white hover:opacity-90 transition-opacity" style={{ background: "var(--accent)" }}>Check invoice</a>
        </div>
      </nav>
    </header>
  );
}
