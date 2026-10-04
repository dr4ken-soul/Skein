import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import type { ExtractionProvider } from "../extract.js";
import type { ExtractedInvoice } from "../types.js";

function fixturesDir(): string {
  // reader/src/providers/fixtures.ts -> reader/fixtures
  const dir = dirname(fileURLToPath(import.meta.url));
  return join(dir, "..", "..", "fixtures");
}

/**
 * Replay provider that returns committed fixture data without any network call.
 * Used when SKEIN_REPLAY=1, which is the default in CI and in the benchmark.
 */
export class FixtureProvider implements ExtractionProvider {
  private invoices: Map<string, ExtractedInvoice> = new Map();

  constructor() {
    this.loadAll();
  }

  private loadAll(): void {
    const base = join(fixturesDir(), "invoices");
    try {
      const files = readdirSync(base).filter((f) => f.endsWith(".json"));
      for (const f of files) {
        const data = JSON.parse(readFileSync(join(base, f), "utf-8")) as ExtractedInvoice;
        this.invoices.set(data.reference, data);
        // Also index by file name without extension
        this.invoices.set(f.replace(".json", ""), data);
      }
    } catch {
      // No fixtures yet, empty map
    }
    // Load distinct fixtures too
    try {
      const distinctBase = join(fixturesDir(), "distinct");
      const files = readdirSync(distinctBase).filter((f) => f.endsWith(".json"));
      for (const f of files) {
        const data = JSON.parse(readFileSync(join(distinctBase, f), "utf-8")) as ExtractedInvoice;
        if (!this.invoices.has(data.reference)) this.invoices.set(data.reference, data);
      }
    } catch {
      // no distinct yet
    }
  }

  getByReference(ref: string): ExtractedInvoice | undefined {
    return this.invoices.get(ref);
  }

  getAllBase(): ExtractedInvoice[] {
    const base = join(fixturesDir(), "invoices");
    try {
      const files = readdirSync(base).filter((f) => f.endsWith(".json"));
      return files.map((f) => JSON.parse(readFileSync(join(base, f), "utf-8")) as ExtractedInvoice);
    } catch {
      return [];
    }
  }

  async extract(input: Uint8Array | string, _mimeType: string): Promise<ExtractedInvoice> {
    const text = typeof input === "string" ? input : new TextDecoder().decode(input);
    // Try to find a reference in the text
    for (const [, inv] of this.invoices) {
      if (text.includes(inv.reference)) return inv;
    }
    // Fallback: return first invoice
    const all = this.getAllBase();
    if (all.length > 0) return all[0]!;
    throw new Error("No fixtures available and no match found for input");
  }
}
