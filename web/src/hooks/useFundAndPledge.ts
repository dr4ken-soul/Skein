"use client";
import { useCallback, useState } from "react";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { skeinRegistryAbi } from "@/lib/abi";
import { MIN_MAX_FEE_PER_GAS } from "@/lib/arc";

const REGISTRY = (process.env.NEXT_PUBLIC_REGISTRY_ADDRESS || "0x0000000000000000000000000000000000000000") as `0x${string}`;

/** Hook for atomic fundAndPledge with fee floor guard. */
export function useFundAndPledge() {
  const { writeContractAsync, isPending } = useWriteContract();
  const [hash, setHash] = useState<`0x${string}` | undefined>();
  const receipt = useWaitForTransactionReceipt({ hash });

  const fund = useCallback(async (args: {
    invoiceId: `0x${string}`;
    seller: `0x${string}`;
    evidenceHash: `0x${string}`;
    verdictHash: `0x${string}`;
    value: bigint;
  }) => {
    const h = await writeContractAsync({
      address: REGISTRY,
      abi: skeinRegistryAbi,
      functionName: "fundAndPledge",
      args: [args.invoiceId, args.seller, args.evidenceHash, args.verdictHash],
      value: args.value,
      maxFeePerGas: MIN_MAX_FEE_PER_GAS,
    });
    setHash(h);
    return h;
  }, [writeContractAsync]);

  return { fund, hash, isPending, receipt };
}
