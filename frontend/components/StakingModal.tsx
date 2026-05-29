"use client";

import { useEffect, useMemo, useState } from "react";
import { formatUnits } from "viem";
import { AlertCircle, Check, X } from "lucide-react";
import { useChainId, useSwitchChain } from "wagmi";
import { Button } from "@/components/ui/button";
import {
  isChainMismatchError,
  MIN_STAKE_OKB,
  OKB_DECIMALS,
  parseOKB,
  useStake,
  xLayerRequiredMessage
} from "@/hooks/useStake";
import { xLayer } from "@/lib/chains";
import { cn } from "@/lib/utils";

type StakeSide = 0 | 1;

type Props = {
  matchId: bigint;
  side: StakeSide;
  onClose: () => void;
  onSuccess: (amount: string, hash: `0x${string}`, mode?: "chain") => void;
};

export function StakingModal({ matchId, side, onClose, onSuccess }: Props) {
  const [amount, setAmount] = useState(MIN_STAKE_OKB);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState<{ amount: string; hash: `0x${string}` } | null>(null);
  const {
    okbBalance,
    minStake,
    stake,
    isPending,
    stakeReceipt,
    refetchPoolState,
    refetchBalance
  } = useStake();
  const chainId = useChainId();
  const { switchChainAsync, isPending: isSwitching } = useSwitchChain();

  const isFollow = side === 0;
  const sideLabel = isFollow ? "Follow" : "Fade";
  const isStaking = isPending || stakeReceipt.isLoading;
  const isBusy = isSwitching || isStaking;

  const stakeAmount = useMemo(() => {
    try {
      return parseOKB(amount);
    } catch {
      return 0n;
    }
  }, [amount]);
  const balanceLabel = Number(formatUnits(okbBalance, OKB_DECIMALS)).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4
  });
  const minStakeLabel = formatUnits(minStake, OKB_DECIMALS);

  useEffect(() => {
    if (stakeReceipt.isSuccess && submitted) {
      refetchPoolState();
      refetchBalance();
      onSuccess(submitted.amount, submitted.hash, "chain");
    }
  }, [onSuccess, refetchBalance, refetchPoolState, stakeReceipt.isSuccess, submitted]);

  async function ensureXLayer() {
    if (chainId === xLayer.id) return true;

    try {
      await switchChainAsync({ chainId: xLayer.id });
      return true;
    } catch {
      setError(xLayerRequiredMessage);
      return false;
    }
  }

  function validateAmount() {
    if (stakeAmount < minStake) {
      setError(`Minimum stake is ${minStakeLabel} OKB.`);
      return false;
    }

    if (stakeAmount > okbBalance) {
      setError("Insufficient OKB balance.");
      return false;
    }

    return true;
  }

  async function handleConfirm() {
    setError("");
    if (!validateAmount()) return;

    const ready = await ensureXLayer();
    if (!ready) return;

    try {
      const hash = await stake(matchId, side, amount);
      setSubmitted({ amount, hash });
    } catch (caught) {
      setError(isChainMismatchError(caught) ? xLayerRequiredMessage : "Stake transaction failed. Please try again.");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-md rounded-lg border border-border bg-bg1">
        <div className="flex items-start justify-between border-b border-border p-4">
          <div>
            <p className="font-mono text-xs uppercase text-muted">Stake on match #{matchId.toString()}</p>
            <h2 className={cn("mt-1 font-display text-2xl font-bold uppercase", isFollow ? "text-green" : "text-coral")}>
              {sideLabel}
            </h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} title="Close staking modal">
            <X size={18} />
          </Button>
        </div>

        <div className="space-y-4 p-4">
          <label className="block">
            <span className="font-mono text-xs uppercase text-muted">Amount / OKB</span>
            <input
              className="mt-2 h-12 w-full rounded-md border border-border bg-bg px-3 font-mono text-lg text-text outline-none transition-colors focus:border-green"
              inputMode="decimal"
              min={minStakeLabel}
              step="0.01"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
            />
          </label>

          <div className="grid gap-2 rounded-md border border-border bg-bg p-3 font-mono text-xs uppercase text-muted">
            <span>
              Balance: <span className="text-text">{balanceLabel} OKB</span>
            </span>
            <span>
              Minimum stake: <span className="text-text">{minStakeLabel} OKB</span>
            </span>
          </div>

          <div className="flex items-center justify-between gap-3 rounded-md border border-border bg-bg p-3 font-mono text-xs uppercase text-muted">
            <span>Send OKB transaction</span>
            <Button variant={isFollow ? "default" : "danger"} onClick={handleConfirm} disabled={isBusy}>
              <Check size={16} />
              {isSwitching ? "Switching" : stakeReceipt.isLoading ? "Confirming" : sideLabel}
            </Button>
          </div>

          <div className="rounded-md border border-border bg-bg p-3 font-mono text-xs uppercase text-muted">
            Positions can only be recorded on <span className="text-green">X Layer</span>.
          </div>

          {error && (
            <div className="flex gap-2 rounded-md border border-coral bg-[#ff6b4a1a] p-3 text-sm text-coral">
              <AlertCircle className="mt-0.5 shrink-0" size={16} />
              <span>{error}</span>
            </div>
          )}

          <Button variant="secondary" onClick={onClose} disabled={isBusy} className="w-full">
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
