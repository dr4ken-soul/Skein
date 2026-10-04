import { keccak256 } from "viem";
import type { CanonicalInvoice } from "./canonicalise";

export interface Fingerprint {
  partyKey: `0x${string}`;
  amountKey: `0x${string}`;
  periodKey: `0x${string}`;
  refKey: `0x${string}`;
  contentKey: `0x${string}`;
  root: `0x${string}`;
}

function keccakStr(salt: `0x${string}`, ...values: string[]): `0x${string}` {
  let hex = salt.slice(2);
  for (const v of values) {
    const enc = new TextEncoder().encode(v);
    for (const b of enc) hex += b.toString(16).padStart(2, "0");
    hex += "00";
  }
  return keccak256(`0x${hex}` as `0x${string}`);
}

export function fingerprint(invoice: CanonicalInvoice, salt: `0x${string}`): Fingerprint {
  const partyKey = keccakStr(salt, invoice.drawer, invoice.payer);
  const amountKey = keccakStr(salt, invoice.currency, invoice.totalMinor.toString());
  const periodKey = keccakStr(salt, invoice.issuedOn, invoice.dueOn);
  const refKey = keccakStr(salt, invoice.reference);
  const contentKey = keccakStr(salt, invoice.lineHash);
  let rootHex = salt.slice(2);
  for (const k of [partyKey, amountKey, periodKey, refKey, contentKey]) rootHex += k.slice(2);
  const root = keccak256(`0x${rootHex}` as `0x${string}`);
  return { partyKey, amountKey, periodKey, refKey, contentKey, root };
}

export function invoiceIdForRoot(root: `0x${string}`, salt: `0x${string}`): `0x${string}` {
  const encoded = `0x${salt.slice(2).padStart(64,"0")}${root.slice(2).padStart(64,"0")}` as `0x${string}`;
  return keccak256(encoded);
}
