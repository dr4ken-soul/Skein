"use client";
import { useEffect, useState, useCallback } from "react";
import { createPublicClient, http, fallback } from "viem";
import { arcMainnet, RPC_URL } from "@/lib/arc";
import { skeinRegistryAbi } from "@/lib/abi";

const REGISTRY = (process.env.NEXT_PUBLIC_REGISTRY_ADDRESS || "0x0000000000000000000000000000000000000000") as `0x${string}`;

export interface PledgeRow {
  invoiceId: `0x${string}`;
  lender: `0x${string}`;
  seller: `0x${string}`;
  advance: bigint;
  blockNumber: bigint;
  pledgedAt: number;
  settled: boolean;
}

/** Reads the registry feed via paged recentIds + getPledge. Polls every 4s. */
export function useRegistryFeed(pageSize = 20) {
  const [rows, setRows] = useState<PledgeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFeed = useCallback(async () => {
    if (REGISTRY === "0x0000000000000000000000000000000000000000") {
      setLoading(false);
      return;
    }
    try {
      const client = createPublicClient({
        chain: arcMainnet,
        transport: fallback([http(RPC_URL), http("https://rpc.testnet.arc.io")]),
      });
      const count = (await client.readContract({ address: REGISTRY, abi: skeinRegistryAbi, functionName: "pledgeCount" })) as bigint;
      if (count === 0n) { setRows([]); setLoading(false); return; }
      const from = count > BigInt(pageSize) ? Number(count - BigInt(pageSize)) : 0;
      const ids = (await client.readContract({ address: REGISTRY, abi: skeinRegistryAbi, functionName: "recentIds", args: [BigInt(from), BigInt(pageSize)] })) as `0x${string}`[];
      const pledges = await Promise.all(ids.map((id) =>
        client.readContract({ address: REGISTRY, abi: skeinRegistryAbi, functionName: "getPledge", args: [id] }) as unknown as Promise<{ lender: `0x${string}`; seller: `0x${string}`; advance: bigint; blockNumber: bigint; pledgedAt: bigint; settled: boolean }>
      ));
      setRows(pledges.map((p, i) => ({
        invoiceId: ids[i]!,
        lender: p.lender,
        seller: p.seller,
        advance: p.advance,
        blockNumber: p.blockNumber,
        pledgedAt: Number(p.pledgedAt),
        settled: p.settled,
      })).reverse());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [pageSize]);

  useEffect(() => {
    fetchFeed();
    const id = setInterval(fetchFeed, 4000);
    return () => clearInterval(id);
  }, [fetchFeed]);

  return { rows, loading, error, refresh: fetchFeed };
}
