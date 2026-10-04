"use client";
import { useConnect } from "wagmi";

export function ConnectModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { connect, connectors } = useConnect();
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white rounded-xl p-6 w-full max-w-sm border" style={{ borderColor: "var(--border)" }}>
        <h3 className="font-medium mb-4">Connect wallet</h3>
        <div className="flex flex-col gap-2">
          {connectors.map((c) => (
            <button key={c.uid} onClick={() => { connect({ connector: c }); onClose(); }} className="px-4 py-2 rounded-lg border text-sm hover:bg-[var(--bg-secondary)] text-left" style={{ borderColor: "var(--border)" }}>
              {c.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
