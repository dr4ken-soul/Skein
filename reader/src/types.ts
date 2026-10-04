export interface ExtractedInvoice {
  drawer: string;
  payer: string;
  currency: string;
  total: string;
  issuedOn: string;
  dueOn: string;
  reference: string;
  lines: Array<{ description: string; quantity: string; unitPrice: string }>;
  confidence: Record<string, number>;
  sourceKind: "pdf" | "image" | "email" | "fixture";
}

export interface CanonicalInvoice {
  drawer: string;
  payer: string;
  currency: string;
  totalMinor: bigint;
  issuedOn: string;
  dueOn: string;
  reference: string;
  lineHash: `0x${string}`;
}

export interface Fingerprint {
  partyKey: `0x${string}`;
  amountKey: `0x${string}`;
  periodKey: `0x${string}`;
  refKey: `0x${string}`;
  contentKey: `0x${string}`;
  root: `0x${string}`;
}

export interface Verdict {
  invoiceId: `0x${string}`;
  fingerprint: Fingerprint;
  matchedKeys: number;
  state: "clear" | "probable-duplicate" | "pledged";
  existing?: { lender: `0x${string}`; blockNumber: bigint; settled: boolean };
  evidenceHash: `0x${string}`;
  verdictHash: `0x${string}`;
}

export interface BenchmarkResult {
  generatedAt: string;
  replay: boolean;
  classes: Array<{
    name: "rename" | "reformat" | "round" | "rescan" | "reissue";
    count: number;
    skeinCaught: number;
    plainHashCaught: number;
  }>;
  falsePositives: { distinctInvoices: number; collisions: number };
  totals: { mutations: number; skeinCaught: number; plainHashCaught: number };
}
