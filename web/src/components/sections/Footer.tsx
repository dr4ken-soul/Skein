export function Footer() {
  return (
    <footer className="border-t py-8" style={{ borderColor: "var(--border)" }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-xs" style={{ color: "var(--text-tertiary)" }}>
        <span>Skein — neutral on-chain registry. No owner, no treasury, no fee in MVP.</span>
        <span>Arc mainnet 5042</span>
      </div>
    </footer>
  );
}
