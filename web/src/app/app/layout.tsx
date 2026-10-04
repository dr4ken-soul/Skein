"use client";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { getWagmiConfig } from "@/lib/wagmi";
import { AppRail } from "@/components/layout/AppRail";
import { DisconnectToast } from "@/components/layout/DisconnectToast";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [config] = useState(() => getWagmiConfig());
  const [queryClient] = useState(() => new QueryClient());
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <div className="flex min-h-screen">
          <AppRail />
          <div className="flex-1 min-w-0">{children}</div>
        </div>
        <DisconnectToast />
      </QueryClientProvider>
    </WagmiProvider>
  );
}
