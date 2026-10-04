"use client";
import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { createPublicClient, http, fallback } from "viem";
import { arcMainnet, RPC_URL, EXPLORER_URL, fromNativeUsdc } from "@/lib/arc";
import { skeinRegistryAbi } from "@/lib/abi";
import { WalletPill } from "@/components/layout/WalletPill";

const REGISTRY = (process.env.NEXT_PUBLIC_REGISTRY_ADDRESS || "0x0000000000000000000000000000000000000000") as `0x${string}`;

export default function PledgesPage() {
  const { address, isConnected } = useAccount();
  const [ids, setIds] = useState<`0x${string}`[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isConnected || !address || REGISTRY === "0x0000000000000000000000000000000000000000") return;
    setLoading(true);
    const client = createPublicClient({ chain: arcMainnet, transport: fallback([http(RPC_URL)]) });
    client.readContract({ address: REGISTRY, abi: skeinRegistryAbi, functionName: "lenderIds", args: [address] })
      .then((r) => setIds(r as `0x${string}`[]))
      .catch(() => setIds([]))
      .finally(() => setLoading(false));
  }, [address, isConnected]);

  if (!isConnected) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center space-y-4">
        <h1 className="font-serif text-2xl">My pledges</h1>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Connect a wallet to view pledge history.</p>
        <div className="flex justify-center pt-2"><WalletPill /></div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <h1 className="font-serif text-2xl">My pledges</h1>
      {loading && <p className="font-mono text-xs" style={{ color: "var(--text-tertiary)" }}>Loading...</p>}
      {!loading && ids.length === 0 && <p className="text-sm" style={{ color: "var(--text-secondary)" }}>No pledges for this wallet.</p>}
      {ids.length > 0 && (
        <div className="rounded-xl border bg-white overflow-hidden" style={{ borderColor: "var(--border)" }}>
          <table className="w-full text-sm">
            <thead><tr className="border-b font-mono text-xs" style={{ borderColor: "var(--border)", color: "var(--text-tertiary)" }}><th className="text-left p-3">InvoiceId</th><th className="text-left p-3">Explorer</th></tr></thead>
            <tbody>
              {ids.map((id) => (
                <tr key={id} className="border-b last:border-0 font-mono text-xs" style={{ borderColor: "var(--border)" }}>
                  <td className="p-3">{id.slice(0, 18)}...{id.slice(-6)}</td>
                  <td className="p-3"><a href={`${EXPLORER_URL}/address/${REGISTRY}`} target="_blank" rel="noreferrer" className="hover:underline" style={{ color: "var(--accent)" }}>View</a></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
