"use client";
import { motion } from "motion/react";

export function PlugsIn() {
  return (
    <section className="py-16 sm:py-24 border-y" style={{ borderColor: "var(--border)", background: "var(--bg-secondary)" }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <motion.div initial={{ filter: "blur(8px)", opacity: 0, y: 16 }} whileInView={{ filter: "blur(0px)", opacity: 1, y: 0 }} viewport={{ once: false, amount: 0.1 }} className="mb-8">
          <p className="font-mono text-xs tracking-[0.15em] uppercase" style={{ color: "var(--accent)" }}>Integrate</p>
          <h2 className="font-serif text-3xl sm:text-4xl mt-2">Two calls. Read before you list or lend, write when you fund.</h2>
        </motion.div>
        <div className="rounded-xl border bg-white overflow-hidden" style={{ borderColor: "var(--border)" }}>
          <div className="p-4 border-b font-mono text-xs" style={{ borderColor: "var(--border)", background: "var(--bg-tertiary)" }}>check then fundAndPledge</div>
          <pre className="p-4 overflow-x-auto text-xs leading-relaxed font-mono" style={{ color: "var(--text-secondary)" }}>{`const { pledged, lender, blockNumber } = await client.readContract({
  ...skeinRegistry, functionName: 'check', args: [invoiceId],
})
if (pledged) return { ok: false, reason: 'AlreadyPledged', lender, blockNumber }

const hash = await walletClient.writeContract({
  ...skeinRegistry, functionName: 'fundAndPledge',
  args: [invoiceId, seller, evidenceHash, verdictHash],
  value: parseUnits('84200', 18),
  maxFeePerGas: 25_000_000_000n,
})`}</pre>
        </div>
        <p className="text-sm mt-4" style={{ color: "var(--text-secondary)" }}>Luminest is integrator number one, check before listing a receivable, fundAndPledge when a bid is accepted. The MCP tool at reader/src/mcp/check.ts exposes skein.check over stdio for agent lenders. It is a stub and is labelled as one.</p>
      </div>
    </section>
  );
}
