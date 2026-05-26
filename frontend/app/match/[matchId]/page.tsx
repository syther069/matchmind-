import { MatchDetailClient } from "@/components/MatchDetailClient";

export default async function MatchPage({ params }: { params: Promise<{ matchId: string }> }) {
  const { matchId } = await params;
  return <MatchDetailClient matchId={matchId} />;
}
