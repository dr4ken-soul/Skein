"use client";
import { useEffect, useState } from "react";
import { useAccount } from "wagmi";

export function DisconnectToast() {
  const { isConnected } = useAccount();
  const [show, setShow] = useState(false);
  const [prev, setPrev] = useState(isConnected);
  useEffect(() => {
    if (prev && !isConnected) { setShow(true); setTimeout(() => setShow(false), 2500); }
    setPrev(isConnected);
  }, [isConnected, prev]);
  if (!show) return null;
  return <div className="fixed bottom-4 right-4 bg-white border rounded-lg px-4 py-2 text-sm shadow-lg" style={{ borderColor: "var(--border)" }}>Wallet disconnected</div>;
}
