"use client";
import { motion } from "motion/react";

const items = [
  { title: "Native USDC", body: "USDC is the gas token. The advance moves as msg.value, no approval, no allowance, one transaction." },
  { title: "Deterministic finality", body: "Sub-second, irreversible. First writer wins means something because the ordering cannot be reorganised." },
  { title: "Arc-anvil tested", body: "Plain anvil cannot reproduce Arc's 18-decimal native USDC, dual Transfer logs or 20 Gwei fee floor." },
  { title: "No wide log scan", body: "The feed pages through recentIds and getPledge via Multicall3. No 10k-block eth_getLogs." },
];

export function OnArc() {
  return (
    <section className="py-16 sm:py-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <motion.div initial={{ filter: "blur(8px)", opacity: 0, y: 16 }} whileInView={{ filter: "blur(0px)", opacity: 1, y: 0 }} viewport={{ once: false, amount: 0.1 }} className="mb-8">
          <p className="font-mono text-xs tracking-[0.15em] uppercase" style={{ color: "var(--accent)" }}>Why Arc</p>
          <h2 className="font-serif text-3xl sm:text-4xl mt-2">Arc is not a convenience here.</h2>
        </motion.div>
        <div className="grid sm:grid-cols-2 gap-4">
          {items.map((it, i) => (
            <motion.div key={it.title} initial={{ filter: "blur(8px)", opacity: 0, y: 16 }} whileInView={{ filter: "blur(0px)", opacity: 1, y: 0 }} viewport={{ once: false, amount: 0.1 }} transition={{ delay: i * 0.07 }} className="rounded-xl border bg-white p-5" style={{ borderColor: "var(--border)" }}>
              <h3 className="font-medium">{it.title}</h3>
              <p className="text-sm mt-2 leading-relaxed" style={{ color: "var(--text-secondary)" }}>{it.body}</p>
            </motion.div>
          ))}
        </div>
        <p className="font-mono text-xs mt-4" style={{ color: "var(--text-tertiary)" }}>Chain 5042, RPC https://rpc.mainnet.arc.io, explorer https://explorer.arc.io</p>
      </div>
    </section>
  );
}
