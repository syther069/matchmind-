import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { formatUnits } from "viem";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function shortAddress(address?: string) {
  if (!address) return "0x0000...0000";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function formatOKB(value: bigint | number | string) {
  const bigintValue = typeof value === "bigint" ? value : BigInt(value);
  const formatted = Number(formatUnits(bigintValue, 18));
  return `${formatted.toLocaleString(undefined, { maximumFractionDigits: 4 })} OKB`;
}

export function outcomeLabel(outcome: number) {
  return outcome === 0 ? "HOME" : outcome === 1 ? "DRAW" : "AWAY";
}

export function timeLeft(kickoff?: number) {
  if (!kickoff) return "PENDING";
  const delta = kickoff * 1000 - Date.now();
  if (delta <= 0) return "LIVE / CLOSED";
  const hours = Math.floor(delta / 3_600_000);
  const minutes = Math.floor((delta % 3_600_000) / 60_000);
  return `${hours}H ${minutes}M`;
}
