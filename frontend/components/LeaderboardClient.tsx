"use client";

import { Trophy } from "lucide-react";
import { useAccount } from "wagmi";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { UserAvatar } from "@/components/UserAvatar";
import { useMarketData } from "@/hooks/useMarketData";
import { deriveLeaderboard } from "@/lib/indexer";
import { useMatchMindUser } from "@/lib/userProfile";
import { formatOKB, shortAddress } from "@/lib/utils";

export function LeaderboardClient() {
  const { data = [] } = useMarketData();
  const { address } = useAccount();
  const { profile } = useMatchMindUser();
  const chainRows = deriveLeaderboard(data);
  const currentAddress = address?.toLowerCase();
  const hasLocalRow = Boolean(
    currentAddress && profile.positions.length > 0 && !chainRows.some((row) => row.address.toLowerCase() === currentAddress)
  );
  const rows = hasLocalRow ? [{ address: address!, pnl: 0n, local: true }, ...chainRows] : chainRows;

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-8">
      <div>
        <p className="font-mono text-sm uppercase text-green">Leaderboard</p>
        <h1 className="font-display text-4xl font-bold uppercase text-text">On-chain PnL ranking</h1>
      </div>
      <Card>
        <CardHeader className="grid grid-cols-[64px_1fr_120px] gap-4 font-mono text-xs uppercase text-muted md:grid-cols-[80px_1fr_160px]">
          <span>Rank</span>
          <span>Trader</span>
          <span className="text-right">PnL</span>
        </CardHeader>
        <CardContent className="p-0">
          {rows.length === 0 ? (
            <div className="p-6 text-muted">No staking activity indexed yet.</div>
          ) : (
            rows.map((row, index) => (
              <div key={row.address} className="grid grid-cols-[64px_1fr_120px] gap-4 border-b border-border p-4 last:border-b-0 md:grid-cols-[80px_1fr_160px]">
                <span className="flex items-center gap-2 font-mono text-amber">
                  <Trophy size={15} /> #{index + 1}
                </span>
                <span className="flex min-w-0 items-center gap-3">
                  <UserAvatar
                    src={address && row.address.toLowerCase() === address.toLowerCase() ? profile.avatar : undefined}
                    username={address && row.address.toLowerCase() === address.toLowerCase() ? profile.username : row.address}
                    size="sm"
                  />
                  <span className="min-w-0">
                    <span className="block truncate font-display text-sm font-bold uppercase text-text">
                      {address && row.address.toLowerCase() === address.toLowerCase() ? profile.username : "X Layer Trader"}
                    </span>
                    <span className="block font-mono text-xs uppercase text-muted">{shortAddress(row.address)}</span>
                  </span>
                </span>
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
