"use client";
import { motion } from "motion/react";

const steps = [
  { n: "01", title: "Invoice NG-2291 arrives", body: "Lender A runs it through the reader. Five salted keys, one root, one invoiceId." },
  { n: "02", title: "Fund and pledge", body: "USDC moves to the seller and the pledge is recorded in the same transaction. One call, no approval." },
  { n: "03", title: "A reissued copy appears", body: "Same parties, same amount, same period. New reference only. Lender B presents it." },
  { n: "04", title: "The chain refuses", body: "AlreadyPledged, with the first lender and block number. That is the product." },
];

export function CatchStory() {
  return (
    <section className="py-16 sm:py-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <motion.div initial={{ filter: "blur(8px)", opacity: 0, y: 16 }} whileInView={{ filter: "blur(0px)", opacity: 1, y: 0 }} viewport={{ once: false, amount: 0.1 }} className="mb-10">
          <p className="font-mono text-xs tracking-[0.15em] uppercase" style={{ color: "var(--accent)" }}>The catch</p>
          <h2 className="font-serif text-3xl sm:text-4xl mt-2">Four beats, one refusal.</h2>
          <p className="font-mono text-xs mt-2" style={{ color: "var(--text-tertiary)" }}>Fixture data in this story. Real mainnet transaction in the README.</p>
        </motion.div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {steps.map((s, i) => (
            <motion.div key={s.n} initial={{ filter: "blur(8px)", opacity: 0, y: 16 }} whileInView={{ filter: "blur(0px)", opacity: 1, y: 0 }} viewport={{ once: false, amount: 0.1 }} transition={{ delay: i * 0.08, duration: 0.6, ease: [0.16, 1, 0.3, 1] }} className="rounded-xl border bg-white p-5 space-y-3" style={{ borderColor: "var(--border)" }}>
              <span className="font-mono text-xs" style={{ color: "var(--accent)" }}>{s.n}</span>
              <h3 className="font-medium">{s.title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>{s.body}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
