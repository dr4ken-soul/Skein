"use client";
import { useRegistryFeed } from "@/hooks/useRegistryFeed";
import { fromNativeUsdc, EXPLORER_URL } from "@/lib/arc";

const REGISTRY = (process.env.NEXT_PUBLIC_REGISTRY_ADDRESS || "") as string;

export default function RegistryPage() {
  const { rows, loading, error } = useRegistryFeed(20);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-6">
        <h1 className="font-serif text-3xl">Registry</h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>Public feed. No wallet needed. Reads via recentIds and getPledge.</p>
        {REGISTRY && REGISTRY !== "0x0000000000000000000000000000000000000000" && (
          <a href={`${EXPLORER_URL}/address/${REGISTRY}`} target="_blank" rel="noreferrer" className="font-mono text-xs mt-2 inline-block hover:underline" style={{ color: "var(--accent)" }}>{REGISTRY}</a>
        )}
      </div>

      {loading && <div className="space-y-3">{[0,1,2].map(i=> <div key={i} className="h-16 rounded-xl border animate-pulse" style={{ borderColor: "var(--border)", background: "var(--bg-secondary)" }} />)}</div>}
      {error && <div className="rounded-xl border p-4 bg-red-50" style={{ borderColor: "#fca5a5" }}><p className="font-mono text-xs">Failed to load feed: {error}</p><p className="font-mono text-xs mt-1" style={{ color: "var(--text-tertiary)" }}>Public RPC caps eth_getLogs at 10k blocks. This feed polls via Multicall3.</p></div>}
      {!loading && !error && rows.length === 0 && <div className="rounded-xl border p-8 text-center" style={{ borderColor: "var(--border)" }}><p className="text-sm" style={{ color: "var(--text-secondary)" }}>No pledges yet. Be the first to pledge a receivable.</p></div>}
      {!loading && rows.length > 0 && (
        <div className="rounded-xl border overflow-hidden bg-white" style={{ borderColor: "var(--border)" }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b font-mono text-xs" style={{ borderColor: "var(--border)", color: "var(--text-tertiary)" }}><th className="text-left p-3">InvoiceId</th><th className="text-left p-3">Lender</th><th className="text-left p-3">Seller</th><th className="text-right p-3">Advance</th><th className="text-right p-3">Block</th><th className="text-center p-3">Settled</th></tr></thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.invoiceId} className="border-b last:border-0 font-mono text-xs" style={{ borderColor: "var(--border)" }}>
                    <td className="p-3 truncate max-w-[160px]">{r.invoiceId.slice(0,10)}...{r.invoiceId.slice(-6)}</td>
                    <td className="p-3">{r.lender.slice(0,6)}...{r.lender.slice(-4)}</td>
                    <td className="p-3">{r.seller.slice(0,6)}...{r.seller.slice(-4)}</td>
                    <td className="text-right p-3">{fromNativeUsdc(r.advance)} USDC</td>
                    <td className="text-right p-3">{String(r.blockNumber)}</td>
                    <td className="text-center p-3">{r.settled ? "yes" : "no"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
