"use client";
import { motion } from "motion/react";
import Link from "next/link";

export function FinalCta() {
  return (
    <section className="py-16 sm:py-24">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center space-y-6">
        <motion.h2 initial={{ filter: "blur(8px)", opacity: 0, y: 16 }} whileInView={{ filter: "blur(0px)", opacity: 1, y: 0 }} viewport={{ once: false, amount: 0.1 }} className="font-serif text-3xl sm:text-4xl">
          An invoice can only be financed once.
        </motion.h2>
        <motion.p initial={{ filter: "blur(8px)", opacity: 0, y: 16 }} whileInView={{ filter: "blur(0px)", opacity: 1, y: 0 }} viewport={{ once: false, amount: 0.1 }} transition={{ delay: 0.08 }} style={{ color: "var(--text-secondary)" }}>
          Built for Arc Microgrants | Circle on DoraHacks. Deadline 14 October 2026.
        </motion.p>
        <motion.div initial={{ filter: "blur(8px)", opacity: 0, y: 16 }} whileInView={{ filter: "blur(0px)", opacity: 1, y: 0 }} viewport={{ once: false, amount: 0.1 }} transition={{ delay: 0.12 }} className="flex flex-wrap justify-center gap-3 pt-2">
          <Link href="/app/check" className="px-6 py-3 rounded-full text-white text-sm font-medium hover:opacity-90" style={{ background: "var(--accent)" }}>Check an invoice</Link>
          <Link href="/registry" className="px-6 py-3 rounded-full border text-sm font-medium hover:bg-[var(--bg-secondary)]" style={{ borderColor: "var(--border)" }}>View registry</Link>
        </motion.div>
      </div>
    </section>
  );
}
