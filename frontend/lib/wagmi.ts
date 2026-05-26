"use client";

import { QueryClient } from "@tanstack/react-query";
import { http, createConfig } from "wagmi";
import { injected, walletConnect } from "wagmi/connectors";
import { xLayer } from "./chains";

declare global {
  interface Window {
    okxwallet?: any;
  }
}

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "matchmind-demo-project";
const connectors: any[] = [
  injected({ target: "metaMask" }),
  injected({
    target: {
      id: "okx",
      name: "OKX Wallet",
      provider: (window?: Window) => window?.okxwallet
    } as any
  })
];

if (process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID) {
  connectors.push(
    walletConnect({
      projectId,
      metadata: {
        name: "MatchMind",
        description: "AI-powered football prediction markets on X Layer",
        url: "https://matchmind.local",
        icons: []
      }
    })
  );
}

export const wagmiConfig = createConfig({
  chains: [xLayer],
  connectors,
  transports: {
    [xLayer.id]: http("https://rpc.xlayer.tech")
  },
  ssr: true
});

export const queryClient = new QueryClient();
