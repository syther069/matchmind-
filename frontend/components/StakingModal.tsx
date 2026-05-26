"use client";

import { useState } from "react";
import { AlertCircle, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStake } from "@/hooks/useStake";
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

  const isFollow = side === 0;
  const sideLabel = isFollow ? "Follow" : "Fade";

  async function handleConfirm() {
    const parsed = Number(amount);
    if (!Number.isFinite(parsed) || parsed < minimumStake) {
      setError("Minimum stake is 0.001 OKB.");
      return;
    }

    setError("");

    try {
      const hash = await stake(matchId, side, amount);
      onSuccess(amount, hash, "chain");
    } catch {
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

          {error && (
            <div className="flex gap-2 rounded-md border border-coral bg-[#ff6b4a1a] p-3 text-sm text-coral">
              <AlertCircle className="mt-0.5 shrink-0" size={16} />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Button variant="secondary" onClick={onClose} disabled={isPending}>
              Cancel
            </Button>
            <Button variant={isFollow ? "default" : "danger"} onClick={handleConfirm} disabled={isPending}>
              <Check size={16} />
              {isPending ? "Confirming" : `Confirm ${sideLabel}`}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
