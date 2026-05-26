"use client";

import { useAccount, useChainId } from "wagmi";
import { xLayer } from "@/lib/chains";

export function NetworkBadge() {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const isXLayer = isConnected && chainId === xLayer.id;

  return (
    <span
      className={`inline-flex h-10 items-center rounded-md border px-3 font-mono text-[10px] font-semibold uppercase tracking-widest ${
        isXLayer
          ? "border-green bg-[#a8ff6e1a] text-green"
          : isConnected
            ? "border-coral bg-[#ff6b4a1a] text-coral"
            : "border-border bg-bg1 text-muted"
      }`}
      title={isXLayer ? "Connected to X Layer" : isConnected ? "Wrong network" : "Wallet not connected"}
    >
      Connected to: {isXLayer ? "X Layer" : isConnected ? "Wrong Network" : "No Network"}
    </span>
  );
}
