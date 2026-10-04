"use client";
import { useAccount } from "wagmi";
import { WalletPill } from "./WalletPill";

export function WalletMenu() {
  const { isConnected } = useAccount();
  return (
    <div className="flex items-center gap-2">
      <WalletPill />
      {isConnected && <span className="w-2 h-2 rounded-full bg-green-500 inline-block" aria-label="connected" />}
    </div>
  );
}
