import { defineChain } from "viem";

/** Arc mainnet. USDC is the native asset and carries 18 decimals. */
export const arcMainnet = defineChain({
  id: 5042,
  name: "Arc",
  network: "arc-mainnet",
  nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://arc-mainnet.g.alchemy.com/v2/alch_PSz9cPwjUFKJ0jJ2fsiqn"] },
    public: { http: ["https://rpc.mainnet.arc.io"] },
  },
  blockExplorers: {
    default: { name: "Arc Explorer", url: "https://explorer.arc.io" },
  },
});

/** Arc drops a transaction below this floor silently, with no receipt. */
export const MIN_MAX_FEE_PER_GAS = 25_000_000_000n;

/** Converts a decimal string to native USDC wei. The only converter in the app. */
export function toNativeUsdc(value: string): bigint {
  const cleaned = value.replace(/[,_\s]/g, "").trim();
  if (!cleaned) return 0n;
  const parts = cleaned.split(".");
  const intPart = parts[0] || "0";
  let frac = parts[1] || "";
  if (frac.length > 18) frac = frac.slice(0, 18);
  frac = frac.padEnd(18, "0");
  return BigInt(intPart) * 10n ** 18n + BigInt(frac);
}

/** Converts native USDC wei to a display string with up to six decimals for UI. */
export function fromNativeUsdc(wei: bigint): string {
  const intPart = wei / 10n ** 18n;
  const frac = wei % 10n ** 18n;
  if (frac === 0n) return intPart.toString();
  let fracStr = frac.toString().padStart(18, "0").slice(0, 6).replace(/0+$/, "");
  if (!fracStr) return intPart.toString();
  return `${intPart}.${fracStr}`;
}

export const REGISTRY_ADDRESS = (process.env.NEXT_PUBLIC_REGISTRY_ADDRESS || "0x0000000000000000000000000000000000000000") as `0x${string}`;
export const REGISTRY_SALT = (process.env.NEXT_PUBLIC_SALT || "0x8f4a2d3c1e5b6a798091a2b3c4d5e6f708192a3b4c5d6e7f8a9b0c1d2e3f405162738") as `0x${string}`;
export const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || "https://arc-mainnet.g.alchemy.com/v2/alch_PSz9cPwjUFKJ0jJ2fsiqn";
export const EXPLORER_URL = process.env.NEXT_PUBLIC_EXPLORER_URL || "https://explorer.arc.io";
