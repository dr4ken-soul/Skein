"use client";
import { motion } from "motion/react";
import Link from "next/link";

export function Hero() {
  return (
    <section className="relative min-h-[85vh] flex items-center">
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
        <div className="grid lg:grid-cols-2 gap-8 items-center">
          <motion.div initial={{ filter: "blur(8px)", opacity: 0, y: 16 }} animate={{ filter: "blur(0px)", opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }} className="space-y-6">
            <p className="font-mono text-xs tracking-[0.15em] uppercase" style={{ color: "var(--accent)" }}>Arc mainnet, chain 5042</p>
            <h1 className="font-serif text-5xl sm:text-6xl lg:text-7xl leading-[1.05] font-normal text-balance" style={{ color: "var(--text-primary)" }}>
              An invoice can only be financed once.
            </h1>
            <p className="text-lg leading-relaxed max-w-lg" style={{ color: "var(--text-secondary)" }}>
              Skein is a neutral on-chain registry that stops one receivable from being pledged twice. First write wins, enforced by Arc.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Link href="/app/check" className="px-6 py-3 rounded-full text-white text-sm font-medium hover:opacity-90 transition-opacity" style={{ background: "var(--accent)" }}>Check an invoice</Link>
              <Link href="/registry" className="px-6 py-3 rounded-full border text-sm font-medium hover:bg-[var(--bg-secondary)] transition-colors" style={{ borderColor: "var(--border)" }}>View registry</Link>
            </div>
            <p className="font-mono text-xs" style={{ color: "var(--text-tertiary)" }}>Only hashes on-chain. No invoice text, no amounts, no party names.</p>
          </motion.div>
          <motion.div initial={{ filter: "blur(8px)", opacity: 0, y: 16 }} animate={{ filter: "blur(0px)", opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.15, ease: [0.16, 1, 0.3, 1] }} className="relative">
            <div className="rounded-2xl border bg-white p-6 space-y-4" style={{ borderColor: "var(--border)" }}>
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs uppercase tracking-widest" style={{ color: "var(--text-tertiary)" }}>Live registry</span>
                <span className="w-2 h-2 rounded-full bg-green-500 inline-block animate-pulse" />
              </div>
              <div className="space-y-3 font-mono text-xs">
                <div className="flex justify-between py-2 border-b" style={{ borderColor: "var(--border)" }}><span>Contract</span><span className="truncate ml-4">{process.env.NEXT_PUBLIC_REGISTRY_ADDRESS || "Deploy to set address"}</span></div>
                <div className="flex justify-between py-2 border-b" style={{ borderColor: "var(--border)" }}><span>Chain</span><span>Arc 5042</span></div>
                <div className="flex justify-between py-2"><span>Fee floor</span><span>25 Gwei</span></div>
              </div>
              <p className="font-mono text-xs p-3 rounded-lg" style={{ background: "var(--bg-secondary)", color: "var(--text-secondary)" }}>Hash the invoice locally, check before you fund, pledge atomically with the payment.</p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
