"use client";

import { deriveAnalytics } from "@/lib/indexer";
import { useMarketData } from "@/hooks/useMarketData";
import { PredictionCard } from "@/components/PredictionCard";
import { RecentActivity } from "@/components/RecentActivity";
import { StatGrid } from "@/components/StatGrid";

export function DashboardClient() {
  const { data, isLoading } = useMarketData();
  const markets = data ?? [];
  const analytics = deriveAnalytics(markets);
  const featured = markets;

  return (
    <main className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8">
      <section className="flex flex-col gap-3 border-b border-border pb-6">
        <p className="font-mono text-sm uppercase text-green">World Cup AI prediction terminal / X Layer mainnet</p>
        <h1 className="max-w-4xl font-display text-5xl font-bold uppercase leading-tight text-text">
          Agent markets ready for live staking.
        </h1>
        <p className="max-w-3xl text-base leading-7 text-muted">
          MatchMind pins predictions before kickoff, surfaces the agent edge, and lets traders follow or fade directly with native OKB on X Layer.
        </p>
      </section>

      <StatGrid {...analytics} />

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl font-bold uppercase text-text">Live Markets</h2>
          <span className="font-mono text-xs uppercase text-muted">
            {isLoading ? "Syncing" : markets.length + " indexed"}
          </span>
        </div>
        {featured.length === 0 && isLoading ? (
          <div className="rounded-lg border border-border bg-bg1 p-8 font-mono text-sm text-muted">
            Syncing predictions from X Layer mainnet...
          </div>
        ) : featured.length === 0 ? (
          <div className="rounded-lg border border-border bg-bg1 p-8 text-muted">
            No markets found.
          </div>
        ) : (
          featured.map((market) => (
            <PredictionCard key={market.matchId.toString()} market={market} />
          ))
        )}
      </section>

      <RecentActivity limit={5} />
    </main>
  );
}
