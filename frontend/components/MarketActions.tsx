"use client";

import { useMemo, useState } from "react";
import { Check, RotateCcw, X } from "lucide-react";
import { getAddress, parseEther } from "viem";
import { useAccount, useChainId, useSwitchChain } from "wagmi";
import { StakingModal } from "@/components/StakingModal";
import { Button } from "@/components/ui/button";
import { isChainMismatchError, useStake, xLayerRequiredMessage } from "@/hooks/useStake";
import { xLayer } from "@/lib/chains";
import type { IndexedMarket } from "@/lib/indexer";
import { useMatchMindUser } from "@/lib/userProfile";
import { formatOKB, shortAddress } from "@/lib/utils";

type Props = {
  market: IndexedMarket;
};

type StakeSide = 0 | 1;

export function MarketActions({ market }: Props) {
  const [selectedSide, setSelectedSide] = useState<StakeSide | null>(null);
  const [localPosition, setLocalPosition] = useState({ follow: 0n, fade: 0n });
  const [lastHash, setLastHash] = useState<`0x${string}` | null>(null);
  const [lastMode, setLastMode] = useState<"chain" | "demo">("chain");
  const [notice, setNotice] = useState("");
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChainAsync, isPending: isSwitching } = useSwitchChain();
  const { claim, isPending } = useStake();
  const { recordPosition } = useMatchMindUser();

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

  function openWalletModal() {
    window.dispatchEvent(new Event("matchmind:open-wallet"));
  }

  async function prepareForPosition(side: StakeSide) {
    setNotice("");

    if (!isConnected) {
      openWalletModal();
      setNotice("Connect your wallet to place a position.");
      return;
    }

    if (chainId !== xLayer.id) {
      try {
        await switchChainAsync({ chainId: xLayer.id });
      } catch {
        setNotice(xLayerRequiredMessage);
        return;
      }
    }

    setSelectedSide(side);
  }

  async function handleClaim() {
    setNotice("");

    if (!isConnected) {
      openWalletModal();
      setNotice("Connect your wallet to claim rewards.");
      return;
    }

    if (chainId !== xLayer.id) {
      try {
        await switchChainAsync({ chainId: xLayer.id });
      } catch {
        setNotice(xLayerRequiredMessage);
        return;
      }
    }

    try {
      await claim(market.matchId);
    } catch (caught) {
      setNotice(isChainMismatchError(caught) ? xLayerRequiredMessage : "Unable to submit claim right now. Please try again.");
    }
  }

  function handleStakeSuccess(amount: string, hash: `0x${string}`, mode: "chain" | "demo" = "chain") {
    if (selectedSide === null) return;

    const value = parseEther(amount);
    setLocalPosition((current) =>
      selectedSide === 0 ? { ...current, follow: current.follow + value } : { ...current, fade: current.fade + value }
    );
    setLastHash(hash);
    setLastMode(mode);
    setNotice(mode === "demo" ? "Transaction failed on X Layer. Demo position recorded locally for judging." : "");
    recordPosition({
      matchId: market.matchId.toString(),
      match: market.reasoning ? `${market.reasoning.homeTeam} vs ${market.reasoning.awayTeam}` : `Match #${market.matchId.toString()}`,
      side: selectedSide === 0 ? "FOLLOW" : "FADE",
      amount,
      txHash: hash,
      demo: mode === "demo"
    });
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

          {notice && (
            <div className="rounded-md border border-amber bg-[#f5a6231a] p-3 font-mono text-xs uppercase leading-5 text-amber">
              {notice}
            </div>
          )}

          {lastHash && lastMode === "chain" && (
            <a
              className="font-mono text-xs uppercase text-green hover:text-text"
              href={`https://www.oklink.com/xlayer/tx/${lastHash}`}
              target="_blank"
              rel="noreferrer"
            >
              Sent {shortAddress(lastHash)}
            </a>
          )}

          {lastHash && lastMode === "demo" && (
            <div className="rounded-md border border-amber bg-[#f5a6231a] p-3 font-mono text-xs uppercase leading-5 text-amber">
              Transaction failed on X Layer. Demo position recorded locally for judging.
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <Button disabled={isSwitching} onClick={() => prepareForPosition(0)} title="Stake on the AI prediction">
              <Check size={16} />
              {isSwitching ? "Switching" : "Follow"}
            </Button>
            <Button variant="danger" disabled={isSwitching} onClick={() => prepareForPosition(1)} title="Stake against the AI prediction">
              <X size={16} />
              {isSwitching ? "Switching" : "Fade"}
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
        <>
          {notice && (
            <div className="rounded-md border border-amber bg-[#f5a6231a] p-3 font-mono text-xs uppercase leading-5 text-amber">
              {notice}
            </div>
          )}
          <Button variant="secondary" disabled={isPending || isSwitching} onClick={handleClaim} title="Claim resolved winnings">
          <RotateCcw size={16} />
            {isSwitching ? "Switching" : "Claim"}
          </Button>
        </>
      )}
    </div>
  );
}
