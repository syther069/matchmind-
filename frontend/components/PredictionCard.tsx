"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { MarketActions } from "@/components/MarketActions";
import type { IndexedMarket } from "@/lib/indexer";
import { formatOKB, timeLeft } from "@/lib/utils";

type Props = {
  market: IndexedMarket;
};

function predictionLabel(market: IndexedMarket) {
  if (market.outcome === 1) return "Draw";
  const homeTeam = market.reasoning?.homeTeam || "Home";
  const awayTeam = market.reasoning?.awayTeam || "Away";
  return market.outcome === 0 ? `${homeTeam} win` : `${awayTeam} win`;
}

function titleFor(market: IndexedMarket) {
  return market.reasoning
    ? `${market.reasoning.homeTeam} vs ${market.reasoning.awayTeam}`
    : `Fixture #${market.matchId.toString()}`;
}

export function PredictionCard({ market }: Props) {
  const status = market.resolved ? (market.correct ? "Agent correct" : "Agent wrong") : "Open for staking";
  const summary = market.reasoning?.reasoning_summary || "On-chain prediction is syncing. Fallback market data is active.";
  const factors = market.reasoning?.key_factors || [];
  const explorerUrl = market.transactionHash ? `https://www.oklink.com/xlayer/tx/${market.transactionHash}` : undefined;

  return (
    <motion.article initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18 }}>
      <Card className="overflow-hidden">
        <CardHeader className="grid gap-4 md:grid-cols-[1fr_auto]">
          <div>
            <div className="flex flex-wrap gap-2">
              <Badge className={market.resolved ? "text-coral" : "text-green"}>{status}</Badge>
              <Badge>{timeLeft(market.kickoff)}</Badge>
              <Badge>Match {market.matchId.toString()}</Badge>
            </div>
            <h2 className="mt-4 font-display text-2xl font-bold uppercase text-text">{titleFor(market)}</h2>
            <p className="mt-1 font-mono text-xs uppercase text-muted">{market.reasoning?.league || "World Cup market"}</p>
          </div>
          <div className="grid grid-cols-2 gap-3 text-left md:min-w-64">
            <div className="rounded-md border border-border bg-bg p-3">
              <p className="font-mono text-xs uppercase text-muted">Agent pick</p>
              <p className="mt-2 font-display text-lg font-bold uppercase text-text">{predictionLabel(market)}</p>
            </div>
            <div className="rounded-md border border-border bg-bg p-3">
              <p className="font-mono text-xs uppercase text-muted">Confidence</p>
              <p className="mt-2 font-mono text-2xl text-green">{market.confidence}%</p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="grid gap-5 lg:grid-cols-[1fr_300px]">
          <div className="space-y-5">
            <p className="max-w-4xl text-sm leading-6 text-text">{summary}</p>

            <div>
              <p className="font-mono text-xs uppercase text-muted">Key factors</p>
              <div className="mt-3 grid gap-2 md:grid-cols-3">
                {factors.map((factor) => (
                  <div key={factor} className="rounded-md border border-border bg-bg p-3 text-sm text-text">
                    {factor}
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-md border border-border bg-bg p-3">
                <p className="font-mono text-xs uppercase text-muted">Follow pool</p>
                <p className="mt-2 font-mono text-xl text-green">{formatOKB(market.followTotal)}</p>
              </div>
              <div className="rounded-md border border-border bg-bg p-3">
                <p className="font-mono text-xs uppercase text-muted">Fade pool</p>
                <p className="mt-2 font-mono text-xl text-coral">{formatOKB(market.fadeTotal)}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-4">
              <Link className="inline-flex items-center gap-2 font-mono text-sm uppercase text-green" href={`/match/${market.matchId.toString()}`}>
                Details <ExternalLink size={14} />
              </Link>
              {explorerUrl && (
                <a
                  className="inline-flex items-center gap-2 font-mono text-sm uppercase text-muted hover:text-green"
                  href={explorerUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  On-chain tx <ExternalLink size={14} />
                </a>
              )}
            </div>
          </div>

          <MarketActions market={market} />
        </CardContent>
      </Card>
    </motion.article>
  );
}
