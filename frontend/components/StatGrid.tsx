import { Activity, Banknote, Percent, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { formatOKB } from "@/lib/utils";

type Props = {
  totalStaked: bigint;
  openMarkets: number;
  agentRoi: number;
  uniqueStakers: number;
};

export function StatGrid({ totalStaked, openMarkets, agentRoi, uniqueStakers }: Props) {
  const stats = [
    { label: "Total staked", value: formatOKB(totalStaked), icon: Banknote, tone: "text-green" },
    { label: "Open markets", value: openMarkets.toString(), icon: Activity, tone: "text-green" },
    { label: "Agent ROI", value: `${agentRoi.toFixed(2)}%`, icon: Percent, tone: agentRoi >= 0 ? "text-green" : "text-coral" },
    { label: "Unique stakers", value: uniqueStakers.toString(), icon: Users, tone: "text-muted" }
  ];

  return (
    <section className="grid gap-3 md:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.label}>
          <CardContent className="flex items-center justify-between gap-4">
            <div>
              <p className="font-mono text-xs uppercase text-muted">{stat.label}</p>
              <p className="mt-2 break-words font-mono text-2xl text-text">{stat.value}</p>
            </div>
            <stat.icon className={stat.tone} size={24} />
          </CardContent>
        </Card>
      ))}
    </section>
  );
}
