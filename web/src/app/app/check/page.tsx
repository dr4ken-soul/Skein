"use client";
import { useState } from "react";
import { useAccount } from "wagmi";
import { WalletPill } from "@/components/layout/WalletPill";
import { canonicalise, type ExtractedInvoice } from "@/lib/canonicalise";
import { fingerprint, invoiceIdForRoot } from "@/lib/fingerprint";
import { toNativeUsdc, fromNativeUsdc, EXPLORER_URL } from "@/lib/arc";
import { useFundAndPledge } from "@/hooks/useFundAndPledge";
import { createPublicClient, http, fallback, keccak256, stringToHex } from "viem";
import { arcMainnet, RPC_URL, REGISTRY_SALT } from "@/lib/arc";
import { skeinRegistryAbi } from "@/lib/abi";

const REGISTRY = (process.env.NEXT_PUBLIC_REGISTRY_ADDRESS || "0x0000000000000000000000000000000000000000") as `0x${string}`;

export default function CheckPage() {
  const { isConnected, address } = useAccount();
  const [fileName, setFileName] = useState<string>("");
  const [invoice, setInvoice] = useState<ExtractedInvoice | null>(null);
  const [verdict, setVerdict] = useState<{ invoiceId: string; state: string; lender?: string; blockNumber?: string } | null>(null);
  const [amount, setAmount] = useState("1");
  const [sellerInput, setSellerInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string>("");
  const { fund, hash } = useFundAndPledge();

  const handleFile = async (f: File) => {
    setFileName(f.name);
    setBusy(true);
    setResult("");
    try {
      // Try server reader route first, fallback to local fixture parse
      const form = new FormData();
      form.append("file", f);
      const res = await fetch("/api/reader", { method: "POST", body: form });
      if (res.ok) {
        const data = await res.json();
        setInvoice(data.invoice ?? null);
        if (data.invoice) {
          const c = canonicalise(data.invoice as ExtractedInvoice);
          const fp = fingerprint(c, REGISTRY_SALT);
          const id = invoiceIdForRoot(fp.root, REGISTRY_SALT);
          // Check chain
          if (REGISTRY !== "0x0000000000000000000000000000000000000000") {
            const client = createPublicClient({ chain: arcMainnet, transport: fallback([http(RPC_URL)]) });
            const [pledged, lender, blockNumber, settled] = await client.readContract({ address: REGISTRY, abi: skeinRegistryAbi, functionName: "check", args: [id] }) as [boolean, string, bigint, boolean];
            setVerdict({ invoiceId: id, state: pledged ? (settled ? "settled" : "pledged") : "clear", lender, blockNumber: String(blockNumber) });
          } else {
            setVerdict({ invoiceId: id, state: "clear" });
          }
        }
      } else {
        // Local JSON fixture fallback
        const text = await f.text();
        try {
          const j = JSON.parse(text) as ExtractedInvoice;
          setInvoice(j);
          const c = canonicalise(j);
          const fp = fingerprint(c, REGISTRY_SALT);
          const id = invoiceIdForRoot(fp.root, REGISTRY_SALT);
          setVerdict({ invoiceId: id, state: "clear" });
          setAmount(j.total || "1");
        } catch {
          setResult("Could not parse file. Upload a JSON fixture or use the Mutation Lab.");
        }
      }
    } catch (e) {
      setResult(e instanceof Error ? e.message : String(e));
    } finally { setBusy(false); }
  };

  const handlePledge = async () => {
    if (!invoice || !verdict) return;
    if (!sellerInput || !sellerInput.startsWith("0x")) { setResult("Enter a valid seller address (0x...)"); return; }
    try {
      setBusy(true);
      const c = canonicalise(invoice);
      const fp = fingerprint(c, REGISTRY_SALT);
      const id = invoiceIdForRoot(fp.root, REGISTRY_SALT);
      const evidenceHash = keccak256(stringToHex(JSON.stringify(invoice)));
      const verdictHash = keccak256(stringToHex(JSON.stringify(verdict)));
      const value = toNativeUsdc(amount);
      const h = await fund({ invoiceId: id, seller: sellerInput as `0x${string}`, evidenceHash, verdictHash, value });
      setResult(`Pledged. Hash: ${h}`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes("AlreadyPledged")) setResult("AlreadyPledged: this invoice is already pledged to another lender.");
      else setResult(msg.slice(0, 400));
    } finally { setBusy(false); }
  };

  if (!isConnected) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center space-y-4">
        <h1 className="font-serif text-2xl">Check workspace</h1>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Connect a wallet to run the check and fund flow. Reading the registry is public, writing needs a wallet.</p>
        <div className="flex justify-center pt-2"><WalletPill /></div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-2xl">Check</h1>
        <span className="font-mono text-xs" style={{ color: "var(--text-tertiary)" }}>{address?.slice(0, 6)}...{address?.slice(-4)}</span>
      </div>

      <div className="rounded-xl border bg-white p-5 space-y-4" style={{ borderColor: "var(--border)" }}>
        <label className="block">
          <span className="font-mono text-xs" style={{ color: "var(--text-tertiary)" }}>Upload invoice (JSON fixture, or PDF/image via server reader)</span>
          <input type="file" accept=".json,.pdf,.png,.jpg,.jpeg" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} className="mt-2 block w-full text-sm file:mr-3 file:px-4 file:py-1.5 file:rounded-full file:border-0 file:bg-[var(--accent)] file:text-white file:text-sm" />
          {fileName && <span className="font-mono text-xs mt-1 block" style={{ color: "var(--text-secondary)" }}>{fileName}</span>}
        </label>
        {busy && <p className="font-mono text-xs" style={{ color: "var(--text-tertiary)" }}>Working...</p>}
        {invoice && (
          <div className="rounded-lg p-3 font-mono text-xs space-y-1" style={{ background: "var(--bg-secondary)" }}>
            <div>Drawer: {invoice.drawer}</div>
            <div>Payer: {invoice.payer}</div>
            <div>Total: {invoice.total} {invoice.currency}</div>
            <div>Ref: {invoice.reference}</div>
            <div>Issued: {invoice.issuedOn} Due: {invoice.dueOn}</div>
          </div>
        )}
        {verdict && (
          <div className={`rounded-lg p-3 font-mono text-xs ${verdict.state === "clear" ? "bg-green-50 border border-green-200" : "bg-amber-50 border border-amber-200"}`}>
            <div>InvoiceId: {verdict.invoiceId.slice(0, 18)}...{verdict.invoiceId.slice(-6)}</div>
            <div>State: {verdict.state}</div>
            {verdict.lender && <div>Lender: {verdict.lender} at block {verdict.blockNumber}</div>}
          </div>
        )}
      </div>

      {invoice && verdict?.state === "clear" && (
        <div className="rounded-xl border bg-white p-5 space-y-4" style={{ borderColor: "var(--border)" }}>
          <h3 className="font-medium">Fund and pledge</h3>
          <label className="block">
            <span className="font-mono text-xs" style={{ color: "var(--text-tertiary)" }}>Seller address (receives USDC)</span>
            <input value={sellerInput} onChange={(e) => setSellerInput(e.target.value)} placeholder="0x..." className="mt-1 w-full rounded-lg border px-3 py-2 font-mono text-sm" style={{ borderColor: "var(--border)" }} />
          </label>
          <label className="block">
            <span className="font-mono text-xs" style={{ color: "var(--text-tertiary)" }}>Advance (USDC, native 18 decimals)</span>
            <input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="1.00" className="mt-1 w-full rounded-lg border px-3 py-2 font-mono text-sm" style={{ borderColor: "var(--border)" }} />
            <span className="font-mono text-xs" style={{ color: "var(--text-tertiary)" }}>= {(() => { try { return fromNativeUsdc(toNativeUsdc(amount)); } catch { return "-"; } })()} USDC display</span>
          </label>
          <button onClick={handlePledge} disabled={busy} className="w-full py-2.5 rounded-full text-white text-sm font-medium disabled:opacity-50" style={{ background: "var(--accent)" }}>
            {busy ? "Submitting..." : "Fund and pledge"}
          </button>
          <p className="font-mono text-xs" style={{ color: "var(--text-tertiary)" }}>Pays the seller and records the pledge atomically. Below 25 Gwei fee is rejected. No receipt means not settled.</p>
        </div>
      )}

      {result && (
        <div className="rounded-xl border p-4 font-mono text-xs break-all" style={{ borderColor: "var(--border)", background: "var(--bg-secondary)" }}>
          {result}
          {hash && <a href={`${EXPLORER_URL}/tx/${hash}`} target="_blank" rel="noreferrer" className="block mt-2 hover:underline" style={{ color: "var(--accent)" }}>View on explorer</a>}
        </div>
      )}
    </div>
  );
}
