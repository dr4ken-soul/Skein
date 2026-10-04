"use client";
import { motion } from "motion/react";
import Link from "next/link";

export function Proof() {
  return (
    <section className="py-16 sm:py-24 border-y" style={{ borderColor: "var(--border)", background: "var(--bg-secondary)" }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <motion.div initial={{ filter: "blur(8px)", opacity: 0, y: 16 }} whileInView={{ filter: "blur(0px)", opacity: 1, y: 0 }} viewport={{ once: false, amount: 0.1 }} className="mb-8">
          <p className="font-mono text-xs tracking-[0.15em] uppercase" style={{ color: "var(--accent)" }}>Proof</p>
          <h2 className="font-serif text-3xl sm:text-4xl mt-2">The refusal is the product.</h2>
        </motion.div>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="rounded-xl border bg-white p-5" style={{ borderColor: "var(--border)" }}>
            <p className="font-mono text-xs" style={{ color: "var(--text-tertiary)" }}>Step 1</p>
            <p className="font-medium mt-1">Lender A funds NG-2291</p>
            <p className="text-sm mt-2" style={{ color: "var(--text-secondary)" }}>fundAndPledge with 1 USDC, pledge recorded.</p>
          </div>
          <div className="rounded-xl border bg-white p-5" style={{ borderColor: "var(--border)" }}>
            <p className="font-mono text-xs" style={{ color: "var(--text-tertiary)" }}>Step 2</p>
            <p className="font-medium mt-1">Lender B reissues NG-2291</p>
            <p className="text-sm mt-2" style={{ color: "var(--text-secondary)" }}>Same receivable, new reference. check says pledged.</p>
          </div>
          <div className="rounded-xl border p-5" style={{ borderColor: "#fca5a5", background: "#fef2f2" }}>
            <p className="font-mono text-xs" style={{ color: "var(--error)" }}>Reverted</p>
            <p className="font-medium mt-1">AlreadyPledged</p>
            <p className="text-sm mt-2" style={{ color: "var(--text-secondary)" }}>Names the first lender and block. No second pledge possible.</p>
          </div>
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/registry" className="px-5 py-2 rounded-full border text-sm hover:bg-white transition-colors" style={{ borderColor: "var(--border)" }}>View registry feed</Link>
          <Link href="/app/check" className="px-5 py-2 rounded-full text-white text-sm hover:opacity-90" style={{ background: "var(--accent)" }}>Try the check workspace</Link>
        </div>
      </div>
    </section>
  );
}
