"use client";
import { useAccount, useConnect, useDisconnect } from "wagmi";

export function WalletPill() {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();

  if (!isConnected) {
    return (
      <button
        onClick={() => connectors[0] && connect({ connector: connectors[0] })}
        className="px-4 py-1.5 rounded-full text-white text-sm hover:opacity-90 transition-opacity"
        style={{ background: "var(--accent)" }}
      >
        Connect wallet
      </button>
    );
  }
  return (
    <button
      onClick={() => disconnect()}
      className="px-3 py-1.5 rounded-full border text-sm font-mono"
      style={{ borderColor: "var(--border)" }}
    >
      {address?.slice(0, 6)}...{address?.slice(-4)}
    </button>
  );
}
