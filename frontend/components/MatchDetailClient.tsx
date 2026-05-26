"use client";

import { ExternalLink } from "lucide-react";
import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { MarketActions } from "@/components/MarketActions";
import { useMarketData } from "@/hooks/useMarketData";
import { formatOKB, outcomeLabel, shortAddress } from "@/lib/utils";

export function MatchDetailClient({ matchId }: { matchId: string }) {
  const { data = [], isLoading } = useMarketData();
  const market = useMemo(() => data.find((item) => item.matchId.toString() === matchId), [data, matchId]);

  if (!market) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="rounded-lg border border-border bg-bg1 p-8 text-muted">
          {isLoading ? "Indexing match events..." : "Match was not found in indexed on-chain events."}
        </div>
      </main>
    );
  }

  const title = market.reasoning
    ? `${market.reasoning.homeTeam} vs ${market.reasoning.awayTeam}`
    : `Fixture #${market.matchId.toString()}`;
  const ipfsUrl = `${process.env.NEXT_PUBLIC_IPFS_GATEWAY || "https://gateway.pinata.cloud/ipfs/"}${market.reasoningCID}`;

  return (
    <main className="mx-auto grid max-w-7xl gap-6 px-4 py-8 lg:grid-cols-[1fr_320px]">
      <section className="flex flex-col gap-6">
        <div>
          <div className="mb-3 flex flex-wrap gap-2">
            <Badge>{market.resolved ? "RESOLVED" : "OPEN"}</Badge>
            <Badge>{outcomeLabel(market.outcome)}</Badge>
            <Badge>{market.confidence}% CONFIDENCE</Badge>
          </div>
          <h1 className="font-display text-4xl font-bold uppercase text-text">{title}</h1>
          <p className="mt-2 font-mono text-sm uppercase text-muted">{market.reasoning?.league || "On-chain fixture"}</p>
        </div>

        <Card>
          <CardHeader>
            <h2 className="font-display text-2xl font-bold uppercase text-text">Reasoning</h2>
          </CardHeader>
          <CardContent className="space-y-5">
            <p className="leading-7 text-text">{market.reasoning?.reasoning_summary || "Reasoning JSON is pinned but not yet hydrated."}</p>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h3 className="font-mono text-xs uppercase text-green">Key factors</h3>
                <ul className="mt-3 space-y-2 text-sm text-text">
                  {(market.reasoning?.key_factors || []).map((factor) => (
                    <li key={factor}>[+] {factor}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="font-mono text-xs uppercase text-coral">Risks</h3>
                <ul className="mt-3 space-y-2 text-sm text-text">
                  {(market.reasoning?.risks || []).map((risk) => (
                    <li key={risk}>[-] {risk}</li>
                  ))}
                </ul>
              </div>
            </div>
            <a className="inline-flex items-center gap-2 font-mono text-sm uppercase text-blue" href={ipfsUrl} target="_blank" rel="noreferrer">
              View IPFS artifact <ExternalLink size={14} />
            </a>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="font-display text-2xl font-bold uppercase text-text">On-chain events</h2>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-md border border-border bg-bg p-3 font-mono text-sm text-muted">
              PredictionSubmitted :: match {market.matchId.toString()} :: CID {market.reasoningCID}
            </div>
            {market.resolved && (
              <div className="rounded-md border border-border bg-bg p-3 font-mono text-sm text-muted">
                PredictionResolved :: agentCorrect {String(market.correct)}
              </div>
            )}
            {market.claims.map((claim) => (
              <div key={`${claim.user}-${claim.amount.toString()}`} className="rounded-md border border-border bg-bg p-3 font-mono text-sm text-muted">
                RewardClaimed :: {shortAddress(claim.user)} :: {formatOKB(claim.amount)}
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <aside className="flex flex-col gap-4">
        <Card>
          <CardHeader>
            <h2 className="font-display text-xl font-bold uppercase text-text">Market</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="font-mono text-xs uppercase text-muted">Follow pool</p>
              <p className="font-mono text-2xl text-green">{formatOKB(market.followTotal)}</p>
            </div>
            <div>
              <p className="font-mono text-xs uppercase text-muted">Fade pool</p>
              <p className="font-mono text-2xl text-coral">{formatOKB(market.fadeTotal)}</p>
            </div>
            <MarketActions market={market} />
          </CardContent>
        </Card>
      </aside>
    </main>
  );
}
