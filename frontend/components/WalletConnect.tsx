"use client";

import { useAccount, useConnect, useDisconnect } from "wagmi";

export function WalletConnect() {
  const { address, isConnected } = useAccount();
  const { connectors, connect } = useConnect();
  const { disconnect } = useDisconnect();

  const open = () => {
    if (isConnected) {
      disconnect();
      return;
    }

    const connector = connectors[0];
    if (connector) connect({ connector });
  };

  return (
    <button
      onClick={() => open()}
      className="cursor-pointer rounded-md border-none bg-[#a8ff6e] px-4 py-2 font-sans text-xs font-semibold uppercase tracking-widest text-[#0a0a0a] transition-opacity hover:opacity-85"
    >
      {isConnected ? `${address?.slice(0, 6)}...${address?.slice(-4)}` : "Connect Wallet"}
    </button>
  );
}
