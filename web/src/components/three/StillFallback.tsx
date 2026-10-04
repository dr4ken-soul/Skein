"use client";

/** Static fallback for mobile and reduced-motion. */
export function StillFallback() {
  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        background:
          "radial-gradient(ellipse at 50% 30%, rgba(196,90,26,0.08) 0%, transparent 60%), linear-gradient(to bottom, transparent 0%, var(--bg-primary) 100%)",
      }}
      aria-hidden="true"
    />
  );
}
