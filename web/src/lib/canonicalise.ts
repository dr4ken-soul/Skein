import { keccak256, stringToHex } from "viem";

const LEGAL_SUFFIXES = [
  "limited","ltd","incorporated","inc","corporation","corp","llc","llp","plc","pty ltd","pty","gmbh","bv","sa","sas","sarl","ag","ab","oy","as","co",
];
const CURRENCY_EXPONENTS: Record<string, number> = {
  USD:2,GBP:2,EUR:2,JPY:0,CHF:2,CAD:2,AUD:2,SGD:2,HKD:2,SEK:2,NOK:2,DKK:2,PLN:2,CZK:2,HUF:2,RON:2,TRY:2,BRL:2,MXN:2,ZAR:2,INR:2,CNY:2,KRW:0,THB:2,MYR:2,IDR:2,PHP:2,NZD:2,AED:2,SAR:2,
};

export interface ExtractedInvoice {
  drawer: string; payer: string; currency: string; total: string;
  issuedOn: string; dueOn: string; reference: string;
  lines: Array<{ description: string; quantity: string; unitPrice: string }>;
  confidence: Record<string, number>; sourceKind: string;
}
export interface CanonicalInvoice {
  drawer: string; payer: string; currency: string; totalMinor: bigint;
  issuedOn: string; dueOn: string; reference: string; lineHash: `0x${string}`;
}

export function canonicalParty(raw: string): string {
  let s = raw.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
  for (const suffix of LEGAL_SUFFIXES) {
    const pattern = new RegExp(`\\b${suffix.replace(/\s+/g, "\\s+")}\\b\\s*$`, "i");
    const stripped = s.replace(pattern, "").trim();
    if (stripped.length > 0 && stripped !== s) { s = stripped; break; }
  }
  return s.replace(/\s+/g, " ").trim();
}
export function toMinorUnits(value: string, currency: string): bigint {
  const code = currency.toUpperCase();
  const exp = CURRENCY_EXPONENTS[code] ?? 2;
  const cleaned = value.replace(/[,_\s]/g, "").trim();
  const parts = cleaned.split(".");
  const intPart = parts[0] || "0";
  let fracPart = parts[1] || "";
  if (fracPart.length > exp) fracPart = fracPart.slice(0, exp);
  fracPart = fracPart.padEnd(exp, "0");
  if (exp === 0) return BigInt(intPart);
  return BigInt(intPart) * 10n ** BigInt(exp) + BigInt(fracPart || "0");
}
export function toIsoDate(raw: string): string {
  const s = raw.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (m) {
    let day: string, month: string;
    const a = parseInt(m[1], 10), b = parseInt(m[2], 10);
    if (a > 12) { day = String(a).padStart(2,"0"); month = String(b).padStart(2,"0"); }
    else if (b > 12) { month = String(a).padStart(2,"0"); day = String(b).padStart(2,"0"); }
    else { day = String(a).padStart(2,"0"); month = String(b).padStart(2,"0"); }
    return `${m[3]}-${month}-${day}`;
  }
  const d = new Date(s);
  if (!isNaN(d.getTime())) return d.toISOString().slice(0,10);
  return s;
}
export function canonicalReference(raw: string): string {
  return raw.toUpperCase().replace(/[^A-Z0-9]/g, "");
}
export function canonicalLineHash(lines: Array<{ description: string; quantity: string; unitPrice: string }>): `0x${string}` {
  if (lines.length === 0) return keccak256(stringToHex(""));
  const sorted = [...lines].map(l=> ({
    desc: l.description.toLowerCase().replace(/[^a-z0-9\s]/g," ").replace(/\s+/g," ").trim(),
    qty: (parseFloat(l.quantity)*1e6).toFixed(0),
    price: l.unitPrice.replace(/[,_\s]/g,"").trim(),
  })).sort((a,b)=> a.desc.localeCompare(b.desc));
  const joined = sorted.map(l=> `${l.desc}|${l.qty}|${l.price}`).join(";");
  return keccak256(stringToHex(joined));
}
export function canonicalise(raw: ExtractedInvoice): CanonicalInvoice {
  return {
    drawer: canonicalParty(raw.drawer),
    payer: canonicalParty(raw.payer),
    currency: raw.currency.toUpperCase(),
    totalMinor: toMinorUnits(raw.total, raw.currency),
    issuedOn: toIsoDate(raw.issuedOn),
    dueOn: toIsoDate(raw.dueOn),
    reference: canonicalReference(raw.reference),
    lineHash: canonicalLineHash(raw.lines),
  };
}
