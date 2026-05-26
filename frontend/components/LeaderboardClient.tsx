"use client";

import { Trophy } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useMarketData } from "@/hooks/useMarketData";
import { deriveLeaderboard } from "@/lib/indexer";
import { formatOKB, shortAddress } from "@/lib/utils";

export function LeaderboardClient() {
  const { data = [] } = useMarketData();
  const rows = deriveLeaderboard(data);

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-8">
      <div>
        <p className="font-mono text-sm uppercase text-green">Leaderboard</p>
        <h1 className="font-display text-4xl font-bold uppercase text-text">On-chain PnL ranking</h1>
      </div>
      <Card>
        <CardHeader className="grid grid-cols-[80px_1fr_160px] gap-4 font-mono text-xs uppercase text-muted">
          <span>Rank</span>
          <span>Address</span>
          <span className="text-right">PnL</span>
        </CardHeader>
        <CardContent className="p-0">
          {rows.length === 0 ? (
            <div className="p-6 text-muted">No staking activity indexed yet.</div>
          ) : (
            rows.map((row, index) => (
              <div key={row.address} className="grid grid-cols-[80px_1fr_160px] gap-4 border-b border-border p-4 last:border-b-0">
                <span className="flex items-center gap-2 font-mono text-amber">
                  <Trophy size={15} /> #{index + 1}
                </span>
                <span className="font-mono text-text">{shortAddress(row.address)}</span>
                <span className={`text-right font-mono ${row.pnl >= 0n ? "text-green" : "text-coral"}`}>
                  {row.pnl >= 0n ? "+" : "-"}
                  {formatOKB(row.pnl < 0n ? -row.pnl : row.pnl)}
                </span>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </main>
  );
}
