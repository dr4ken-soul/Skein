"use client";
import { motion } from "motion/react";
import { useEffect, useState } from "react";

interface BenchmarkJson {
  classes: Array<{ name: string; count: number; skeinCaught: number; plainHashCaught: number }>;
  totals: { mutations: number; skeinCaught: number; plainHashCaught: number };
  falsePositives: { distinctInvoices: number; collisions: number };
}

export function Comparison() {
  const [data, setData] = useState<BenchmarkJson | null>(null);
  useEffect(() => {
    fetch("/benchmark.json").then((r) => r.json()).then(setData).catch(() => {});
  }, []);
  return (
    <section className="py-16 sm:py-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <motion.div initial={{ filter: "blur(8px)", opacity: 0, y: 16 }} whileInView={{ filter: "blur(0px)", opacity: 1, y: 0 }} viewport={{ once: false, amount: 0.1 }} className="mb-8">
          <p className="font-mono text-xs tracking-[0.15em] uppercase" style={{ color: "var(--accent)" }}>Skein vs plain hash</p>
          <h2 className="font-serif text-3xl sm:text-4xl mt-2">Measured, not asserted.</h2>
        </motion.div>
        {data ? (
          <div className="overflow-x-auto rounded-xl border bg-white" style={{ borderColor: "var(--border)" }}>
            <table className="w-full text-sm">
              <thead><tr className="border-b font-mono text-xs" style={{ borderColor: "var(--border)", color: "var(--text-tertiary)" }}><th className="text-left p-3">Class</th><th className="text-right p-3">Count</th><th className="text-right p-3">Skein</th><th className="text-right p-3">Plain hash</th></tr></thead>
              <tbody>
                {data.classes.map((c) => (
                  <tr key={c.name} className="border-b last:border-0" style={{ borderColor: "var(--border)" }}><td className="p-3 font-mono">{c.name}</td><td className="text-right p-3">{c.count}</td><td className="text-right p-3 font-medium">{c.skeinCaught}</td><td className="text-right p-3" style={{ color: "var(--text-secondary)" }}>{c.plainHashCaught}</td></tr>
                ))}
                <tr className="font-medium border-t" style={{ borderColor: "var(--borderStrong, var(--border))" }}><td className="p-3">Total</td><td className="text-right p-3">{data.totals.mutations}</td><td className="text-right p-3">{data.totals.skeinCaught}</td><td className="text-right p-3">{data.totals.plainHashCaught}</td></tr>
              </tbody>
            </table>
            <p className="p-3 font-mono text-xs" style={{ color: "var(--text-tertiary)" }}>False positives: {data.falsePositives.collisions} / {data.falsePositives.distinctInvoices} distinct invoices sharing one payer.</p>
          </div>
        ) : (
          <div className="rounded-xl border p-8 text-center font-mono text-sm" style={{ borderColor: "var(--border)", color: "var(--text-tertiary)" }}>Loading benchmark...</div>
        )}
        <p className="font-mono text-xs mt-3" style={{ color: "var(--text-tertiary)" }}>Reproduce: SKEIN_REPLAY=1 npm run benchmark in reader/</p>
      </div>
    </section>
  );
}
