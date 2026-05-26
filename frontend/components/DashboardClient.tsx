"use client";

import { deriveAnalytics } from "@/lib/indexer";
import { useMarketData } from "@/hooks/useMarketData";
import { PredictionCard } from "@/components/PredictionCard";
import { StatGrid } from "@/components/StatGrid";

const ON_CHAIN_PROOFS = [
  { match: "Brazil vs Argentina", conf: "73%", prediction: "Brazil Win", tx: "0xcde68b8d02691d6b6169d551da93787868c6f20b690f613d435a6176e5b5b563" },
  { match: "France vs England", conf: "58%", prediction: "Draw", tx: "0x40c4254a601b43a46c918cb0a7375c3faf5bc949501e47d9e1168b40ba84fbe1" },
  { match: "Portugal vs Morocco", conf: "81%", prediction: "Portugal Win", tx: "0x70164e5d961dcf28e5c020fd85b6d7ead17d45522077aa6a108f7a72fc8ded40" }
];

export function DashboardClient() {
  const { data, isLoading } = useMarketData();
  const markets = data ?? [];
  const analytics = deriveAnalytics(markets);
  const featured = markets.slice(0, 3);

  return (
    <main className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8">
      <section className="flex flex-col gap-3 border-b border-border pb-6">
        <p className="font-mono text-sm uppercase text-green">World Cup AI prediction terminal / X Layer mainnet</p>
        <h1 className="max-w-4xl font-display text-5xl font-bold uppercase leading-tight text-text">
          Agent markets ready for live staking.
        </h1>
        <p className="max-w-3xl text-base leading-7 text-muted">
          MatchMind pins predictions before kickoff, surfaces the agent edge, and lets traders follow or fade directly with OKB on X Layer.
        </p>
      </section>

      <StatGrid {...analytics} />

      <div className="mb-2 overflow-hidden rounded-xl border border-[rgba(255,255,255,0.07)]">
        <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.07)] px-4 py-3">
          <span className="font-mono text-[10px] font-semibold uppercase tracking-widest text-[#666560]">
            On-chain proof — X Layer Mainnet
          </span>
          <span className="font-mono text-[10px] text-[#a8ff6e]">3 predictions committed</span>
        </div>
        {ON_CHAIN_PROOFS.map(({ match, conf, prediction, tx }) => (
          <a key={tx} href={"https://www.oklink.com/xlayer/tx/" + tx} target="_blank" rel="noopener noreferrer" className="group flex items-center justify-between border-b border-[rgba(255,255,255,0.05)] px-4 py-3 transition-colors hover:bg-[#181818]">
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded bg-[#2a3d1a] px-2 py-1 font-mono text-[10px] text-[#a8ff6e]">{prediction}</span>
              <span className="text-xs text-[#e8e6e0]">{match}</span>
              <span className="font-mono text-[10px] text-[#666560]">{conf} confidence</span>
            </div>
            <span className="font-mono text-[10px] text-[#444340] transition-colors group-hover:text-[#a8ff6e]">
              {tx.slice(0, 8)}...{tx.slice(-6)}
            </span>
          </a>
        ))}
      </div>

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
    </main>
  );
}
