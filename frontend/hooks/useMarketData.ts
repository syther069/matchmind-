"use client";

import { useQuery } from "@tanstack/react-query";
import { getIndexedMarkets, IndexedMarket } from "@/lib/indexer";

const FALLBACK_MARKETS: IndexedMarket[] = [
  {
    matchId: 1n,
    outcome: 0,
    confidence: 73,
    reasoningCID: "QmTvvgBABLE6WW9eCFCUficLyi7szbvQ53cTEorfzhib6i",
    submittedAt: Math.floor(Date.now() / 1000) - 7200,
    kickoff: Math.floor(Date.now() / 1000) + 86400,
    resolved: false,
    followTotal: 0n,
    fadeTotal: 0n,
    stakers: new Set(),
    positions: new Map(),
    claims: [],
    reasoning: {
      matchId: 1,
      kickoff: new Date(Date.now() + 86400000).toISOString(),
      homeTeam: "Brazil",
      awayTeam: "Argentina",
      league: "2026 FIFA World Cup",
      outcome: 0,
      confidence: 73,
      edge: 6.1,
      key_factors: ["Brazil 5-match unbeaten run", "Messi injury doubt confirmed", "Market edge +6.1%", "Home continent advantage"],
      risks: ["Argentina tournament experience", "High-pressure knockout mentality"],
      reasoning_summary: "Brazil recent form and Messi fitness concerns shift the H2H baseline. Market underpricing Brazil by 6.1%.",
      generatedAt: new Date().toISOString(),
      model: "matchmind-agent-v1"
    }
  },
  {
    matchId: 2n,
    outcome: 1,
    confidence: 58,
    reasoningCID: "QmdLxKNeWuNaGTWkrkJxhNzQcK7Q5VvAxQVvLuWiA12eXq",
    submittedAt: Math.floor(Date.now() / 1000) - 5400,
    kickoff: Math.floor(Date.now() / 1000) + 172800,
    resolved: false,
    followTotal: 0n,
    fadeTotal: 0n,
    stakers: new Set(),
    positions: new Map(),
    claims: [],
    reasoning: {
      matchId: 2,
      kickoff: new Date(Date.now() + 172800000).toISOString(),
      homeTeam: "France",
      awayTeam: "England",
      league: "2026 FIFA World Cup",
      outcome: 1,
      confidence: 58,
      edge: 3.4,
      key_factors: ["Both teams already qualified", "H2H: 4 draws in last 8", "Low motivation", "Market edge +3.4%"],
      risks: ["France push for group leadership", "England attacking depth"],
      reasoning_summary: "Both sides qualified, H2H strongly favors draw. Market slightly underpricing draw probability.",
      generatedAt: new Date().toISOString(),
      model: "matchmind-agent-v1"
    }
  },
  {
    matchId: 3n,
    outcome: 0,
    confidence: 81,
    reasoningCID: "QmWTtwThL9iPdiz4rQDD8h2s3RQB6MRhyNv3kqPfuwLUKn",
    submittedAt: Math.floor(Date.now() / 1000) - 3600,
    kickoff: Math.floor(Date.now() / 1000) + 259200,
    resolved: false,
    followTotal: 0n,
    fadeTotal: 0n,
    stakers: new Set(),
    positions: new Map(),
    claims: [],
    reasoning: {
      matchId: 3,
      kickoff: new Date(Date.now() + 259200000).toISOString(),
      homeTeam: "Portugal",
      awayTeam: "Morocco",
      league: "2026 FIFA World Cup",
      outcome: 0,
      confidence: 81,
      edge: 8.8,
      key_factors: ["Ronaldo in career-best form", "Morocco away: 2W 8L", "Market edge +8.8%", "Portugal depth"],
      risks: ["Morocco defensive organization", "Atlas Lions 2022 motivation"],
      reasoning_summary: "Portugal quality plus Morocco poor away form creates strongest market edge of group stage.",
      generatedAt: new Date().toISOString(),
      model: "matchmind-agent-v1"
    }
  }
];

export function useMarketData() {
  return useQuery({
    queryKey: ["matchmind-markets"],
    queryFn: async () => {
      try {
        const chainData = await Promise.race([
          getIndexedMarkets(),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error("timeout")), 5000)
          )
        ]);
        return chainData.length > 0 ? chainData : FALLBACK_MARKETS;
      } catch {
        return FALLBACK_MARKETS;
      }
    },
    refetchInterval: 20_000,
    staleTime: 10_000,
    initialData: FALLBACK_MARKETS
  });
}