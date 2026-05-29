import { createPublicClient, getAddress, http, parseAbiItem } from "viem";
import type { AbiEvent } from "viem";
import { xLayer } from "./chains";
import { poolAbi, poolAddress, registryAddress } from "./contracts";

export type IndexedMarket = {
  matchId: bigint;
  outcome: number;
  confidence: number;
  reasoningCID: string;
  transactionHash?: `0x${string}`;
  submittedAt: number;
  kickoff?: number;
  resolved: boolean;
  correct?: boolean;
  followTotal: bigint;
  fadeTotal: bigint;
  stakers: Set<string>;
  positions: Map<string, { follow: bigint; fade: bigint }>;
  claims: {
    user: string;
    amount: bigint;
  }[];
  reasoning?: ReasoningArtifact;
};

export type ReasoningArtifact = {
  matchId: number;
  kickoff: string;
  homeTeam: string;
  awayTeam: string;
  league: string;
  outcome: number;
  confidence: number;
  edge: number;
  key_factors: string[];
  risks: string[];
  reasoning_summary: string;
  generatedAt: string;
  model: string;
};

export const publicClient = createPublicClient({
  chain: xLayer,
  transport: http("https://rpc.xlayer.tech")
});

const knownRegistryStartBlock = 60850360n;
const configuredFromBlock = BigInt(process.env.NEXT_PUBLIC_FROM_BLOCK || "0");
const fromBlock = configuredFromBlock === 0n ? knownRegistryStartBlock : configuredFromBlock;
const configuredToBlock = process.env.NEXT_PUBLIC_TO_BLOCK ? BigInt(process.env.NEXT_PUBLIC_TO_BLOCK) : undefined;
const gateway = process.env.NEXT_PUBLIC_IPFS_GATEWAY || "https://gateway.pinata.cloud/ipfs/";
const logBlockRange = 100n;
const ipfsTimeoutMs = 2_500;
const hydrateIpfs = process.env.NEXT_PUBLIC_HYDRATE_IPFS === "true";
const indexPoolLogs = process.env.NEXT_PUBLIC_INDEX_POOL_LOGS === "true";

const predictionSubmitted = parseAbiItem(
  "event PredictionSubmitted(uint256 indexed matchId, uint8 indexed outcome, uint8 confidence, string reasoningCID, uint256 timestamp)"
);
const predictionResolved = parseAbiItem(
  "event PredictionResolved(uint256 indexed matchId, bool correct, uint256 timestamp)"
);
const marketOpened = parseAbiItem("event MarketOpened(uint256 indexed matchId, uint256 kickoff)");
const stakePlaced = parseAbiItem(
  "event StakePlaced(uint256 indexed matchId, address indexed user, uint8 indexed side, uint256 amount)"
);
const poolResolved = parseAbiItem(
  "event PoolResolved(uint256 indexed matchId, bool agentCorrect, uint256 followTotal, uint256 fadeTotal, uint256 protocolFees)"
);
const rewardClaimed = parseAbiItem("event RewardClaimed(uint256 indexed matchId, address indexed user, uint256 amount)");

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return String(error);
}

async function getLogsInChunks(address: `0x${string}`, events: readonly AbiEvent[], startBlock: bigint, endBlock: bigint) {
  if (startBlock > endBlock) return [];

  const logs: any[] = [];
  let cursor = startBlock;

  while (cursor <= endBlock) {
    const chunkEnd = cursor + logBlockRange - 1n < endBlock ? cursor + logBlockRange - 1n : endBlock;
    let chunk: any[] = [];

    for (let attempt = 0; attempt < 4; attempt += 1) {
      try {
        chunk = await publicClient.getLogs({
          address,
          events,
          fromBlock: cursor,
          toBlock: chunkEnd
        });
        break;
      } catch (error) {
        if (attempt === 3) throw error;

        const message = getErrorMessage(error).toLowerCase();
        const delay = message.includes("rate limit") ? 1_000 * (attempt + 1) : 300 * (attempt + 1);
        await wait(delay);
      }
    }

    logs.push(...chunk);
    cursor = chunkEnd + 1n;
  }

  return logs;
}

async function fetchReasoning(cid: string): Promise<ReasoningArtifact | undefined> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ipfsTimeoutMs);

  try {
    const response = await fetch(`${gateway}${cid}`, {
      next: { revalidate: 60 },
      signal: controller.signal
    });
    if (!response.ok) return undefined;
    return (await response.json()) as ReasoningArtifact;
  } catch {
    return undefined;
  } finally {
    clearTimeout(timeout);
  }
}


export async function getIndexedMarkets(): Promise<IndexedMarket[]> {
  if (!registryAddress || !poolAddress) return [];
  const activePoolAddress = poolAddress;

  const latestBlock = configuredToBlock || (await publicClient.getBlockNumber());
  const registryLogs = await getLogsInChunks(
    registryAddress,
    [predictionSubmitted, predictionResolved],
    fromBlock,
    latestBlock
  );
  const poolLogs = indexPoolLogs
    ? await getLogsInChunks(poolAddress, [marketOpened, stakePlaced, poolResolved, rewardClaimed], fromBlock, latestBlock)
    : [];
  const predictionLogs = registryLogs.filter((log) => log.eventName === "PredictionSubmitted");
  const registryResolutionLogs = registryLogs.filter((log) => log.eventName === "PredictionResolved");
  const marketLogs = poolLogs.filter((log) => log.eventName === "MarketOpened");
  const stakeLogs = poolLogs.filter((log) => log.eventName === "StakePlaced");
  const poolResolutionLogs = poolLogs.filter((log) => log.eventName === "PoolResolved");
  const claimLogs = poolLogs.filter((log) => log.eventName === "RewardClaimed");

  const markets = new Map<bigint, IndexedMarket>();

  for (const log of predictionLogs) {
    const matchId = log.args.matchId!;
    markets.set(matchId, {
      matchId,
      outcome: Number(log.args.outcome),
      confidence: Number(log.args.confidence),
      reasoningCID: log.args.reasoningCID!,
      transactionHash: log.transactionHash,
      submittedAt: Number(log.args.timestamp),
      resolved: false,
      followTotal: 0n,
      fadeTotal: 0n,
      stakers: new Set(),
      positions: new Map(),
      claims: []
    });
  }

  for (const log of marketLogs) {
    const market = markets.get(log.args.matchId!);
    if (market) market.kickoff = Number(log.args.kickoff);
  }

  for (const log of stakeLogs) {
    const market = markets.get(log.args.matchId!);
    if (!market) continue;
    if (Number(log.args.side) === 0) market.followTotal += log.args.amount!;
    else market.fadeTotal += log.args.amount!;
    const user = getAddress(log.args.user!);
    const position = market.positions.get(user) || { follow: 0n, fade: 0n };
    if (Number(log.args.side) === 0) position.follow += log.args.amount!;
    else position.fade += log.args.amount!;
    market.positions.set(user, position);
    market.stakers.add(user);
  }

  for (const log of registryResolutionLogs) {
    const market = markets.get(log.args.matchId!);
    if (!market) continue;
    market.resolved = true;
    market.correct = log.args.correct;
  }

  for (const log of poolResolutionLogs) {
    const market = markets.get(log.args.matchId!);
    if (!market) continue;
    market.resolved = true;
    market.correct = log.args.agentCorrect;
    market.followTotal = log.args.followTotal!;
    market.fadeTotal = log.args.fadeTotal!;
  }

  for (const log of claimLogs) {
    const market = markets.get(log.args.matchId!);
    if (!market) continue;
    market.claims.push({
      user: getAddress(log.args.user!),
      amount: log.args.amount!
    });
  }

  await Promise.all(
    [...markets.values()].map(async (market) => {
      try {
        const pool = await publicClient.readContract({
          address: activePoolAddress,
          abi: poolAbi,
          functionName: "pools",
          args: [market.matchId]
        });
        market.followTotal = pool[0];
        market.fadeTotal = pool[1];
        if (pool[2] > 0n) market.kickoff = Number(pool[2]);
        market.resolved = pool[3];
        market.correct = pool[4];
      } catch {
        // Event-derived data remains usable if a pool read times out.
      }
    })
  );

  const hydrated = hydrateIpfs
    ? await Promise.all(
        [...markets.values()].map(async (market) => ({
          ...market,
          reasoning: await fetchReasoning(market.reasoningCID)
        }))
      )
    : [...markets.values()];

  return hydrated.sort((a, b) => Number((b.kickoff || b.submittedAt) - (a.kickoff || a.submittedAt)));
}

export function deriveAnalytics(markets: IndexedMarket[]) {
  const resolved = markets.filter((market) => market.resolved);
  const wins = resolved.filter((market) => market.correct).length;
  const totalStaked = markets.reduce((sum, market) => sum + market.followTotal + market.fadeTotal, 0n);
  const roiBase = resolved.reduce((sum, market) => sum + market.followTotal + market.fadeTotal, 0n);
  const wonLiquidity = resolved
    .filter((market) => market.correct)
    .reduce((sum, market) => sum + market.followTotal + market.fadeTotal, 0n);
  const averageConfidence =
    markets.length === 0 ? 0 : markets.reduce((sum, market) => sum + market.confidence, 0) / markets.length;

  let longestStreak = 0;
  let current = 0;
  for (const market of resolved.sort((a, b) => a.submittedAt - b.submittedAt)) {
    if (market.correct) current += 1;
    else current = 0;
    longestStreak = Math.max(longestStreak, current);
  }

  return {
    totalStaked,
    openMarkets: markets.filter((market) => !market.resolved).length,
    uniqueStakers: new Set(markets.flatMap((market) => [...market.stakers])).size,
    winRate: resolved.length === 0 ? 0 : (wins / resolved.length) * 100,
    agentRoi: roiBase === 0n ? 0 : (Number(wonLiquidity - roiBase) / Number(roiBase)) * 100,
    averageConfidence,
    longestStreak,
    resolvedCount: resolved.length
  };
}

export function deriveLeaderboard(markets: IndexedMarket[]) {
  const pnl = new Map<string, bigint>();

  for (const market of markets) {
    for (const [user, position] of market.positions) {
      if (!pnl.has(user)) pnl.set(user, 0n);
      pnl.set(user, (pnl.get(user) || 0n) - position.follow - position.fade);
    }
    for (const claim of market.claims) {
      pnl.set(claim.user, (pnl.get(claim.user) || 0n) + claim.amount);
    }
  }

  return [...pnl.entries()]
    .map(([address, value]) => ({ address, pnl: value }))
    .sort((a, b) => (a.pnl === b.pnl ? 0 : a.pnl > b.pnl ? -1 : 1));
}
