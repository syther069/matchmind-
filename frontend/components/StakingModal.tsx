"use client";

import { useState } from "react";
import { AlertCircle, Check, X } from "lucide-react";
import { useChainId, useSwitchChain } from "wagmi";
import { Button } from "@/components/ui/button";
import { isChainMismatchError, useStake, xLayerRequiredMessage } from "@/hooks/useStake";
import { xLayer } from "@/lib/chains";
import { cn } from "@/lib/utils";

type StakeSide = 0 | 1;

type Props = {
  matchId: bigint;
  side: StakeSide;
  onClose: () => void;
  onSuccess: (amount: string, hash: `0x${string}`, mode?: "chain" | "demo") => void;
};

const minimumStake = 0.001;

function createDemoHash(matchId: bigint, side: StakeSide, amount: string): `0x${string}` {
  const input = `${matchId.toString()}-${side}-${amount}-${Date.now()}`;
  const encoded = Array.from(input)
    .map((char) => char.charCodeAt(0).toString(16).padStart(2, "0"))
    .join("");
  return `0x${encoded.padEnd(64, "0").slice(0, 64)}`;
}

export function StakingModal({ matchId, side, onClose, onSuccess }: Props) {
  const [amount, setAmount] = useState("0.001");
  const [error, setError] = useState("");
  const { stake, isPending } = useStake();
  const chainId = useChainId();
  const { switchChainAsync, isPending: isSwitching } = useSwitchChain();

  const isFollow = side === 0;
  const sideLabel = isFollow ? "Follow" : "Fade";
  const isBusy = isPending || isSwitching;

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

  async function handleConfirm() {
    const parsed = Number(amount);
    if (!Number.isFinite(parsed) || parsed < minimumStake) {
      setError("Minimum stake is 0.001 OKB.");
      return;
    }

    setError("");

    const ready = await ensureXLayer();
    if (!ready) return;

    try {
      const hash = await stake(matchId, side, amount);
      onSuccess(amount, hash, "chain");
    } catch (caught) {
      if (isChainMismatchError(caught)) {
        setError(xLayerRequiredMessage);
        return;
      }

      onSuccess(amount, createDemoHash(matchId, side, amount), "demo");
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
              min={minimumStake}
              step="0.001"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
            />
          </label>

          <div className="rounded-md border border-border bg-bg p-3 font-mono text-xs uppercase text-muted">
            Minimum stake: <span className="text-text">0.001 OKB</span>
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

          <div className="grid grid-cols-2 gap-3">
            <Button variant="secondary" onClick={onClose} disabled={isBusy}>
              Cancel
            </Button>
            <Button variant={isFollow ? "default" : "danger"} onClick={handleConfirm} disabled={isBusy}>
              <Check size={16} />
              {isSwitching ? "Switching" : isPending ? "Confirming" : `Confirm ${sideLabel}`}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
