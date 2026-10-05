import { createConfig, http, fallback } from "wagmi";
import { createStorage, cookieStorage } from "wagmi";
import { injected, walletConnect } from "wagmi/connectors";
import { arcMainnet, RPC_URL } from "./arc";

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "demo";

export function getWagmiConfig() {
  return createConfig({
    chains: [arcMainnet],
    ssr: true,
    storage: createStorage({ storage: cookieStorage }),
    transports: {
      [arcMainnet.id]: fallback([http(RPC_URL), http("https://rpc.mainnet.arc.io")]),
    },
    connectors: [
      injected(),
      walletConnect({ projectId }),
    ],
  });
}
