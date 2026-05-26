"use client";

import { useMemo, useState } from "react";
import { PredictionCard } from "@/components/PredictionCard";
import { Button } from "@/components/ui/button";
import { useMarketData } from "@/hooks/useMarketData";

type Filter = "all" | "upcoming" | "live" | "resolved";

export function PredictionFeedClient() {
  const [filter, setFilter] = useState<Filter>("all");
  const { data = [], isLoading } = useMarketData();

  const markets = useMemo(() => {
    const now = Date.now() / 1000;
    if (filter === "resolved") return data.filter((market) => market.resolved);
    if (filter === "upcoming") return data.filter((market) => !market.resolved && market.kickoff && market.kickoff > now);
    if (filter === "live") return data.filter((market) => !market.resolved && market.kickoff && market.kickoff <= now);
    return data;
  }, [data, filter]);

  return (
    <main className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8">
      <div className="flex flex-col gap-4 border-b border-border pb-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="font-mono text-sm uppercase text-green">Prediction feed</p>
          <h1 className="font-display text-4xl font-bold uppercase text-text">Markets, signals, staking</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          {(["all", "upcoming", "live", "resolved"] as Filter[]).map((item) => (
            <Button key={item} variant={filter === item ? "default" : "secondary"} onClick={() => setFilter(item)}>
              {item}
            </Button>
          ))}
        </div>
      </div>

      <section className="flex flex-col gap-4">
        {markets.length === 0 ? (
          <div className="rounded-lg border border-border bg-bg1 p-8 text-muted">
            {isLoading ? "Indexing X Layer events..." : "No markets in this segment yet."}
          </div>
        ) : (
          markets.map((market) => <PredictionCard key={market.matchId.toString()} market={market} />)
        )}
      </section>
    </main>
  );
}
