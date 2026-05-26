"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useMarketData } from "@/hooks/useMarketData";
import { deriveAnalytics } from "@/lib/indexer";
import { outcomeLabel } from "@/lib/utils";

export function AnalyticsClient() {
  const { data = [] } = useMarketData();
  const analytics = deriveAnalytics(data);

  const rows = [
    ["Win rate", `${analytics.winRate.toFixed(2)}%`],
    ["ROI", `${analytics.agentRoi.toFixed(2)}%`],
    ["Average confidence", `${analytics.averageConfidence.toFixed(2)}%`],
    ["Longest streak", analytics.longestStreak.toString()],
    ["Resolved predictions", analytics.resolvedCount.toString()]
  ];

  return (
    <main className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8">
      <div>
        <p className="font-mono text-sm uppercase text-green">Analytics</p>
        <h1 className="font-display text-4xl font-bold uppercase text-text">Agent performance terminal</h1>
      </div>
      <section className="grid gap-4 md:grid-cols-5">
        {rows.map(([label, value]) => (
          <Card key={label}>
            <CardContent>
              <p className="font-mono text-xs uppercase text-muted">{label}</p>
              <p className="mt-3 font-mono text-2xl text-text">{value}</p>
            </CardContent>
          </Card>
        ))}
      </section>
      <Card>
        <CardHeader>
          <h2 className="font-display text-2xl font-bold uppercase text-text">Prediction history</h2>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full min-w-[760px] border-collapse font-mono text-sm">
            <thead className="text-muted">
              <tr className="border-b border-border">
                <th className="p-4 text-left">Match</th>
                <th className="p-4 text-left">Pick</th>
                <th className="p-4 text-left">Confidence</th>
                <th className="p-4 text-left">Status</th>
                <th className="p-4 text-left">CID</th>
              </tr>
            </thead>
            <tbody>
              {data.map((market) => (
                <tr key={market.matchId.toString()} className="border-b border-border last:border-b-0">
                  <td className="p-4 text-text">
                    {market.reasoning ? `${market.reasoning.homeTeam} vs ${market.reasoning.awayTeam}` : market.matchId.toString()}
                  </td>
                  <td className="p-4 text-blue">{outcomeLabel(market.outcome)}</td>
                  <td className="p-4 text-green">{market.confidence}%</td>
                  <td className={market.resolved ? (market.correct ? "p-4 text-green" : "p-4 text-coral") : "p-4 text-amber"}>
                    {market.resolved ? (market.correct ? "CORRECT" : "WRONG") : "OPEN"}
                  </td>
                  <td className="p-4 text-muted">{market.reasoningCID.slice(0, 14)}...</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </main>
  );
}
