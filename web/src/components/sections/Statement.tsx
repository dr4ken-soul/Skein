"use client";
import { motion } from "motion/react";

export function Statement() {
  return (
    <section className="py-16 sm:py-24 border-y" style={{ borderColor: "var(--border)", background: "var(--bg-secondary)" }}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center space-y-6">
        <motion.p initial={{ filter: "blur(8px)", opacity: 0, y: 16 }} whileInView={{ filter: "blur(0px)", opacity: 1, y: 0 }} viewport={{ once: false, amount: 0.1 }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }} className="font-serif text-2xl sm:text-3xl leading-tight">
          Receivables can be copied exactly. That is the whole problem.
        </motion.p>
        <motion.p initial={{ filter: "blur(8px)", opacity: 0, y: 16 }} whileInView={{ filter: "blur(0px)", opacity: 1, y: 0 }} viewport={{ once: false, amount: 0.1 }} transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }} className="leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          The same document with the same reference can be presented to several funders at once and each one believes it holds exclusive rights. First Brands and Tricolor are the recent alleged cases, and the reported scale runs into the billions. Each funder checked the collateral against its own book and never against a shared one, because no shared one existed.
        </motion.p>
      </div>
    </section>
  );
}
