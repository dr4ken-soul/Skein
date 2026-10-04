/**
 * Skein MCP stub. Exposes skein.check and skein.fingerprint over stdio.
 * This is a stub and is labelled as one. It wraps the same view calls
 * the web app uses. No auth, not run against a live agent framework.
 */

import { canonicalise } from "../canonicalise.js";
import { fingerprint, invoiceIdForRoot } from "../fingerprint.js";
import type { ExtractedInvoice } from "../types.js";

const DEFAULT_SALT = "0x4a1a0a3e5e8c9e0b8d0f1a2c3e4d5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3" as `0x${string}`;

/**
 * Derive fingerprint and invoiceId locally. No chain call.
 * @param invoice - extracted invoice fields
 * @param salt - registry salt
 */
export function skeinFingerprint(invoice: ExtractedInvoice, salt: `0x${string}` = DEFAULT_SALT) {
  const canonical = canonicalise(invoice);
  const fp = fingerprint(canonical, salt);
  const id = invoiceIdForRoot(fp.root, salt);
  return { canonical, fingerprint: fp, invoiceId: id };
}

// Minimal stdio handler for MCP-like usage
if (process.argv.includes("--stdio")) {
  process.stdin.setEncoding("utf-8");
  let buf = "";
  process.stdin.on("data", (chunk: string) => {
    buf += chunk;
    const lines = buf.split("\n");
    buf = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const req = JSON.parse(line);
        if (req.method === "skein.fingerprint") {
          const result = skeinFingerprint(req.params as ExtractedInvoice, req.params?.salt);
          process.stdout.write(JSON.stringify({ id: req.id, result }) + "\n");
        } else {
          process.stdout.write(JSON.stringify({ id: req.id, error: "unknown method" }) + "\n");
        }
      } catch (e) {
        process.stdout.write(JSON.stringify({ error: String(e) }) + "\n");
      }
    }
  });
}
