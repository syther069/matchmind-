"use client";

import { useAccount, useConnect, useDisconnect } from "wagmi";
import { useState } from "react";

export function WalletConnect() {
  const { address, isConnected } = useAccount();
  const { connectors, connect, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const [showModal, setShowModal] = useState(false);

  if (isConnected && address) {
    return (
      <button
        onClick={() => disconnect()}
        className="cursor-pointer rounded-md border border-[rgba(255,255,255,0.07)] bg-transparent px-4 py-2 font-mono text-xs text-[#a8ff6e] transition-opacity hover:opacity-75"
      >
        {address.slice(0, 6)}...{address.slice(-4)}
      </button>
    );
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="cursor-pointer rounded-md border-none bg-[#a8ff6e] px-4 py-2 font-sans text-xs font-semibold uppercase tracking-widest text-[#0a0a0a] transition-opacity hover:opacity-85"
      >
        Connect Wallet
      </button>

      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
          onClick={() => setShowModal(false)}
        >
          <div
            className="flex w-72 flex-col gap-2 rounded-xl border border-[rgba(255,255,255,0.1)] bg-[#111111] p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-2 flex items-center justify-between">
              <span className="font-mono text-xs uppercase tracking-widest text-[#666560]">
                Select wallet
              </span>
              <button
                onClick={() => setShowModal(false)}
                className="text-[#666560] hover:text-white"
              >
                x
              </button>
            </div>
            {connectors.map((connector) => (
              <button
                key={connector.uid}
                disabled={isPending}
                onClick={() => {
                  connect({ connector });
                  setShowModal(false);
                }}
                className="flex items-center gap-3 rounded-lg border border-[rgba(255,255,255,0.07)] bg-[#181818] px-4 py-3 text-left text-sm text-[#e8e6e0] transition-colors hover:border-[#a8ff6e] hover:bg-[#2a3d1a] disabled:opacity-50"
              >
                {connector.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}