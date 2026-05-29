"use client";

import { useQuery } from "@tanstack/react-query";
import { getIndexedMarkets, IndexedMarket } from "@/lib/indexer";

const FALLBACK_MARKETS: IndexedMarket[] = [
  {
    matchId: 1n,
    outcome: 0,
    confidence: 73,
    reasoningCID: "cid:1:0:73:Brazil:Argentina",
    submittedAt: Math.floor(Date.now() / 1000) - 7200,
    kickoff: Math.floor(Date.now() / 1000) + 2592000,
    resolved: false,
    followTotal: 0n,
    fadeTotal: 0n,
    stakers: new Set(),
    positions: new Map(),
    claims: [],
    reasoning: {
      matchId: 1,
      kickoff: new Date(Date.now() + 2592000000).toISOString(),
      homeTeam: "Brazil",
      awayTeam: "Argentina",
      league: "2026 FIFA World Cup",
      outcome: 0,
      confidence: 73,
      edge: 5.8,
      key_factors: ["Brazil attacking depth", "Argentina transition risk", "Market edge +5.8%", "Set-piece advantage"],
      risks: ["Argentina tournament control", "Late lineup changes"],
      reasoning_summary: "Brazil's attacking depth gives the agent a positive edge over Argentina before kickoff.",
      generatedAt: new Date().toISOString(),
      model: "matchmind-agent-v1"
    }
  },
  {
    matchId: 2n,
    outcome: 1,
    confidence: 58,
    reasoningCID: "cid:2:1:58:France:England",
    submittedAt: Math.floor(Date.now() / 1000) - 6600,
    kickoff: Math.floor(Date.now() / 1000) + 2678400,
    resolved: false,
    followTotal: 0n,
    fadeTotal: 0n,
    stakers: new Set(),
    positions: new Map(),
    claims: [],
    reasoning: {
      matchId: 2,
      kickoff: new Date(Date.now() + 2678400000).toISOString(),
      homeTeam: "France",
      awayTeam: "England",
      league: "2026 FIFA World Cup",
      outcome: 1,
      confidence: 58,
      edge: 4.2,
      key_factors: ["Balanced elite squads", "Both sides conservative in knockout setups", "Draw edge +4.2%", "Midfield parity"],
      risks: ["France wide pace", "England set-piece edge"],
      reasoning_summary: "France and England profile as a tight match where the draw has the best relative value.",
      generatedAt: new Date().toISOString(),
      model: "matchmind-agent-v1"
    }
  },
  {
    matchId: 3n,
    outcome: 0,
    confidence: 81,
    reasoningCID: "cid:3:0:81:Portugal:Morocco",
    submittedAt: Math.floor(Date.now() / 1000) - 6000,
    kickoff: Math.floor(Date.now() / 1000) + 2764800,
    resolved: false,
    followTotal: 0n,
    fadeTotal: 0n,
    stakers: new Set(),
    positions: new Map(),
    claims: [],
    reasoning: {
      matchId: 3,
      kickoff: new Date(Date.now() + 2764800000).toISOString(),
      homeTeam: "Portugal",
      awayTeam: "Morocco",
      league: "2026 FIFA World Cup",
      outcome: 0,
      confidence: 81,
      edge: 4.9,
      key_factors: ["Portugal chance creation", "Morocco low-block variance", "Market edge +4.9%", "Bench depth advantage"],
      risks: ["Morocco counterattack threat", "Tournament pressure"],
      reasoning_summary: "Portugal's shot creation and bench depth make the home win the agent's preferred side.",
      generatedAt: new Date().toISOString(),
      model: "matchmind-agent-v1"
    }
  },
  {
    matchId: 4n,
    outcome: 0,
    confidence: 76,
    reasoningCID: "cid:4:0:76:Spain:Germany",
    submittedAt: Math.floor(Date.now() / 1000) - 5400,
    kickoff: Math.floor(Date.now() / 1000) + 2851200,
    resolved: false,
    followTotal: 0n,
    fadeTotal: 0n,
    stakers: new Set(),
    positions: new Map(),
    claims: [],
    reasoning: {
      matchId: 4,
      kickoff: new Date(Date.now() + 2851200000).toISOString(),
      homeTeam: "Spain",
      awayTeam: "Germany",
      league: "2026 FIFA World Cup",
      outcome: 0,
      confidence: 76,
      edge: 5.2,
      key_factors: ["Spain dominant possession profile", "Germany inconsistent defensive structure", "Market edge +5.2%", "Spain midfield control"],
      risks: ["Germany tournament pedigree", "Set-piece volatility"],
      reasoning_summary: "Spain's possession control and Germany's defensive inconsistency create a measurable edge on Spain to win.",
      generatedAt: new Date().toISOString(),
      model: "matchmind-agent-v1"
    }
  },
  {
    matchId: 5n,
    outcome: 1,
    confidence: 62,
    reasoningCID: "cid:5:1:62:England:Netherlands",
    submittedAt: Math.floor(Date.now() / 1000) - 4800,
    kickoff: Math.floor(Date.now() / 1000) + 2937600,
    resolved: false,
    followTotal: 0n,
    fadeTotal: 0n,
    stakers: new Set(),
    positions: new Map(),
    claims: [],
    reasoning: {
      matchId: 5,
      kickoff: new Date(Date.now() + 2937600000).toISOString(),
      homeTeam: "England",
      awayTeam: "Netherlands",
      league: "2026 FIFA World Cup",
      outcome: 1,
      confidence: 62,
      edge: 3.6,
      key_factors: ["Balanced squad quality", "England set-piece edge", "Draw edge +3.6%", "Netherlands transition control"],
      risks: ["England late pressure", "Netherlands finishing variance"],
      reasoning_summary: "The agent rates England vs Netherlands as a tight match where the draw carries the best relative value.",
      generatedAt: new Date().toISOString(),
      model: "matchmind-agent-v1"
    }
  },
  {
    matchId: 6n,
    outcome: 0,
    confidence: 69,
    reasoningCID: "cid:6:0:69:Brazil:France",
    submittedAt: Math.floor(Date.now() / 1000) - 3600,
    kickoff: Math.floor(Date.now() / 1000) + 3024000,
    resolved: false,
    followTotal: 0n,
    fadeTotal: 0n,
    stakers: new Set(),
    positions: new Map(),
    claims: [],
    reasoning: {
      matchId: 6,
      kickoff: new Date(Date.now() + 3024000000).toISOString(),
      homeTeam: "Brazil",
      awayTeam: "France",
      league: "2026 FIFA World Cup",
      outcome: 0,
      confidence: 69,
      edge: 4.1,
      key_factors: ["Brazil attacking ceiling", "France fullback exposure", "Market edge +4.1%", "Brazil midfield pressure"],
      risks: ["France counterattack quality", "Elite matchup variance"],
      reasoning_summary: "Brazil's pressure profile gives the agent a narrow home-win edge over France.",
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
