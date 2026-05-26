"use client";

import { parseEther } from "viem";
import { useWriteContract } from "wagmi";
import { xLayer } from "@/lib/chains";
import { poolAbi, poolAddress } from "@/lib/contracts";

export const xLayerRequiredMessage = "Please switch to X Layer Network to place a position.";

export function isChainMismatchError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return /chain mismatch|current chain|target chain|switch chain|unsupported chain|chain id/i.test(message);
}

export function useStake() {
  const write = useWriteContract();

  async function stake(matchId: bigint, side: 0 | 1, amount: string) {
    if (!poolAddress) throw new Error("NEXT_PUBLIC_POOL is not configured.");
    return write.writeContractAsync({
      address: poolAddress,
      abi: poolAbi,
      chainId: xLayer.id,
      functionName: "stake",
      args: [matchId, side],
      value: parseEther(amount)
    });
  }

  async function claim(matchId: bigint) {
    if (!poolAddress) throw new Error("NEXT_PUBLIC_POOL is not configured.");
    return write.writeContractAsync({
      address: poolAddress,
      abi: poolAbi,
      chainId: xLayer.id,
      functionName: "claim",
      args: [matchId]
    });
  }

  return { ...write, stake, claim };
}
