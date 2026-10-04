"use client";
import { useState } from "react";
import { motion } from "motion/react";
import { canonicalise, type ExtractedInvoice } from "@/lib/canonicalise";
import { fingerprint } from "@/lib/fingerprint";

const CLASSES = ["rename", "reformat", "round", "rescan", "reissue"] as const;

const EXAMPLE_BASE: ExtractedInvoice = {
  drawer: "Atlas Supply Co", payer: "Northgate Freight Ltd", currency: "USD", total: "84200.00",
  issuedOn: "2026-03-04", dueOn: "2026-04-04", reference: "NG-2291",
  lines: [{ description: "Freight services", quantity: "2", unitPrice: "1200.00" }],
  confidence: {}, sourceKind: "fixture",
};

const MUTATIONS: Record<string, ExtractedInvoice> = {
  rename: { ...EXAMPLE_BASE, payer: "NORTHGATE FREIGHT LIMITED", drawer: "ATLAS SUPPLY CO" },
  reformat: { ...EXAMPLE_BASE, payer: "Northgate Freight Ltd" },
  round: { ...EXAMPLE_BASE, total: "84200" },
  rescan: { ...EXAMPLE_BASE, payer: "Northgate Freight Ltd" },
  reissue: { ...EXAMPLE_BASE, reference: "RE-5001" },
};

const SALT = (process.env.NEXT_PUBLIC_SALT || "0x8f4a2d3c1e5b6a798091a2b3c4d5e6f708192a3b4c5d6e7f8a9b0c1d2e3f405162738") as `0x${string}`;

export function MutationLab() {
  const [active, setActive] = useState<string>("rename");
  const baseFp = fingerprint(canonicalise(EXAMPLE_BASE), SALT);
  const mutFp = fingerprint(canonicalise(MUTATIONS[active]!), SALT);
  const keys: Array<{ label: string; match: boolean }> = [
    { label: "partyKey", match: baseFp.partyKey === mutFp.partyKey },
    { label: "amountKey", match: baseFp.amountKey === mutFp.amountKey },
    { label: "periodKey", match: baseFp.periodKey === mutFp.periodKey },
    { label: "refKey", match: baseFp.refKey === mutFp.refKey },
    { label: "contentKey", match: baseFp.contentKey === mutFp.contentKey },
  ];
  const rootMatch = baseFp.root === mutFp.root;

  return (
    <section className="py-16 sm:py-24 border-y" style={{ borderColor: "var(--border)", background: "var(--bg-secondary)" }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <motion.div initial={{ filter: "blur(8px)", opacity: 0, y: 16 }} whileInView={{ filter: "blur(0px)", opacity: 1, y: 0 }} viewport={{ once: false, amount: 0.1 }} className="mb-8">
          <p className="font-mono text-xs tracking-[0.15em] uppercase" style={{ color: "var(--accent)" }}>Mutation lab</p>
          <h2 className="font-serif text-3xl sm:text-4xl mt-2">Cosmetics do not create new receivables.</h2>
          <p className="text-sm mt-2 max-w-2xl" style={{ color: "var(--text-secondary)" }}>Runs the real canonicalise and fingerprint code in the browser. No network call.</p>
        </motion.div>
        <div className="flex flex-wrap gap-2 mb-6">
          {CLASSES.map((c) => (
            <button key={c} onClick={() => setActive(c)} className={`px-4 py-1.5 rounded-full border text-sm font-mono ${active === c ? "bg-[var(--text-primary)] text-white border-transparent" : "bg-white hover:bg-[var(--bg-tertiary)]"}`} style={{ borderColor: active === c ? "transparent" : "var(--border)" }}>{c}</button>
          ))}
        </div>
        <div className="grid sm:grid-cols-5 gap-3 mb-4">
          {keys.map((k) => (
            <div key={k.label} className={`rounded-lg border p-3 text-center ${k.match ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
              <p className="font-mono text-xs">{k.label}</p>
              <p className="font-mono text-xs mt-1">{k.match ? "match" : "differs"}</p>
            </div>
          ))}
        </div>
        <div className={`rounded-xl border p-4 font-mono text-sm ${rootMatch ? "bg-green-50 border-green-200" : "bg-amber-50 border-amber-200"}`}>
          Root: {rootMatch ? "same — duplicate caught" : "different — reissue gap (advisory only, see Limitations)"}
        </div>
      </div>
    </section>
  );
}
