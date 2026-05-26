"use client";

import { useMemo, useState } from "react";
import { Check, RotateCcw, X } from "lucide-react";
import { getAddress, parseEther } from "viem";
import { useAccount } from "wagmi";
import { StakingModal } from "@/components/StakingModal";
import { Button } from "@/components/ui/button";
import { useStake } from "@/hooks/useStake";
import type { IndexedMarket } from "@/lib/indexer";
import { formatOKB, shortAddress } from "@/lib/utils";

type Props = {
  market: IndexedMarket;
};

type StakeSide = 0 | 1;

export function MarketActions({ market }: Props) {
  const [selectedSide, setSelectedSide] = useState<StakeSide | null>(null);
  const [localPosition, setLocalPosition] = useState({ follow: 0n, fade: 0n });
  const [lastHash, setLastHash] = useState<`0x${string}` | null>(null);
  const { address, isConnected } = useAccount();
  const { claim, isPending } = useStake();

  const accountPosition = useMemo(() => {
    if (!address) return { follow: 0n, fade: 0n };
    try {
      return market.positions.get(getAddress(address)) || { follow: 0n, fade: 0n };
    } catch {
      return { follow: 0n, fade: 0n };
    }
  }, [address, market.positions]);

  const userPosition = {
    follow: accountPosition.follow + localPosition.follow,
    fade: accountPosition.fade + localPosition.fade
  };
  const hasPosition = userPosition.follow > 0n || userPosition.fade > 0n;

  function handleStakeSuccess(amount: string, hash: `0x${string}`) {
    const value = parseEther(amount);
    setLocalPosition((current) =>
      selectedSide === 0 ? { ...current, follow: current.follow + value } : { ...current, fade: current.fade + value }
    );
    setLastHash(hash);
    setSelectedSide(null);
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-bg p-3">
      {!market.resolved ? (
        <>
          <div>
            <p className="font-mono text-xs uppercase text-muted">Your position</p>
            {hasPosition ? (
              <div className="mt-2 grid grid-cols-2 gap-2 font-mono text-xs">
                <div className="rounded-md border border-border p-2">
                  <span className="block text-muted">Follow</span>
                  <span className="text-green">{formatOKB(userPosition.follow)}</span>
                </div>
                <div className="rounded-md border border-border p-2">
                  <span className="block text-muted">Fade</span>
                  <span className="text-coral">{formatOKB(userPosition.fade)}</span>
                </div>
              </div>
            ) : (
              <p className="mt-2 font-mono text-xs uppercase text-muted">
                {isConnected ? "No active stake" : "Connect wallet to stake"}
              </p>
            )}
          </div>

          {lastHash && (
            <a
              className="font-mono text-xs uppercase text-green hover:text-text"
              href={`https://www.oklink.com/xlayer/tx/${lastHash}`}
              target="_blank"
              rel="noreferrer"
            >
              Sent {shortAddress(lastHash)}
            </a>
          )}

          <div className="grid grid-cols-2 gap-2">
            <Button disabled={!isConnected} onClick={() => setSelectedSide(0)} title="Stake on the AI prediction">
              <Check size={16} />
              Follow
            </Button>
            <Button variant="danger" disabled={!isConnected} onClick={() => setSelectedSide(1)} title="Stake against the AI prediction">
              <X size={16} />
              Fade
            </Button>
          </div>

          {selectedSide !== null && (
            <StakingModal
              matchId={market.matchId}
              side={selectedSide}
              onClose={() => setSelectedSide(null)}
              onSuccess={handleStakeSuccess}
            />
          )}
        </>
      ) : (
        <Button variant="secondary" disabled={!isConnected || isPending} onClick={() => claim(market.matchId)} title="Claim resolved winnings">
          <RotateCcw size={16} />
          Claim
        </Button>
      )}
    </div>
  );
}
