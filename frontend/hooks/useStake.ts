"use client";

import { useState } from "react";
import { parseEther } from "viem";
import { useAccount, useBalance, useReadContract, useReadContracts, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { xLayer } from "@/lib/chains";
import { poolAbi, poolAddress } from "@/lib/contracts";

export const OKB_DECIMALS = 18;
export const MIN_STAKE_OKB = "0.001";
export const xLayerRequiredMessage = "Please switch to X Layer to place a position.";

export function parseOKB(amount: string) {
  return parseEther(amount || "0");
}

export function isChainMismatchError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return /chain mismatch|current chain|target chain|switch chain|unsupported chain|chain id/i.test(message);
}

export function useStake() {
  const { address } = useAccount();
  const write = useWriteContract();
  const [stakeHash, setStakeHash] = useState<`0x${string}`>();
  const [claimHash, setClaimHash] = useState<`0x${string}`>();

  const poolState = useReadContracts({
    contracts:
      address && poolAddress
        ? [
            {
              address: poolAddress,
              abi: poolAbi,
              functionName: "minStake"
            }
          ]
        : [],
    query: {
      enabled: Boolean(address && poolAddress),
      refetchInterval: 10_000
    }
  });

  const balance = useBalance({
    address,
    chainId: xLayer.id,
    query: {
      enabled: Boolean(address),
      refetchInterval: 10_000
    }
  });

  const stakeReceipt = useWaitForTransactionReceipt({
    chainId: xLayer.id,
    hash: stakeHash
  });
  const claimReceipt = useWaitForTransactionReceipt({
    chainId: xLayer.id,
    hash: claimHash
  });

  const minStake = poolState.data?.[0]?.result ?? parseOKB(MIN_STAKE_OKB);
  const okbBalance = balance.data?.value ?? 0n;

  async function stake(matchId: bigint, side: 0 | 1, amount: string) {
    if (!poolAddress) throw new Error("NEXT_PUBLIC_POOL is not configured.");
    const hash = await write.writeContractAsync({
      address: poolAddress,
      abi: poolAbi,
      chainId: xLayer.id,
      functionName: "stake",
      args: [matchId, side],
      value: parseOKB(amount)
    });
    setStakeHash(hash);
    return hash;
  }

  async function claim(matchId: bigint) {
    if (!poolAddress) throw new Error("NEXT_PUBLIC_POOL is not configured.");
    const hash = await write.writeContractAsync({
      address: poolAddress,
      abi: poolAbi,
      chainId: xLayer.id,
      functionName: "claim",
      args: [matchId]
    });
    setClaimHash(hash);
    return hash;
  }

  return {
    ...write,
    okbBalance,
    minStake,
    stakeHash,
    claimHash,
    stakeReceipt,
    claimReceipt,
    refetchPoolState: poolState.refetch,
    refetchBalance: balance.refetch,
    stake,
    claim
  };
}

export function useUserPosition(matchId?: bigint) {
  const { address } = useAccount();
  const position = useReadContract({
    address: poolAddress,
    abi: poolAbi,
    chainId: xLayer.id,
    functionName: "stakes",
    args: matchId && address ? [matchId, address] : undefined,
    query: {
      enabled: Boolean(poolAddress && matchId && address),
      refetchInterval: 10_000
    }
  });

  const data = position.data;
  return {
    follow: data?.[0] ?? 0n,
    fade: data?.[1] ?? 0n,
    claimed: data?.[2] ?? false,
    refetchPosition: position.refetch,
    isLoadingPosition: position.isLoading
  };
}
