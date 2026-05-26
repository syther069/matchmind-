import { publicClient, registryAbi, registryAddress, resolverAbi, resolverAddress, walletClient } from "./config.js";
import { fetchCompletedFixture } from "./fetchMatches.js";
import type { Outcome } from "./types.js";

function actualOutcome(homeGoals: number, awayGoals: number): Outcome {
  if (homeGoals > awayGoals) return 0;
  if (homeGoals === awayGoals) return 1;
  return 2;
}

export async function resolveFinishedMatch(matchId: number) {
  const prediction = await publicClient.readContract({
    address: registryAddress,
    abi: registryAbi,
    functionName: "getPrediction",
    args: [BigInt(matchId)]
  });

  if (prediction.resolved) {
    return { skipped: true, reason: "already-resolved", matchId };
  }

  const fixture = await fetchCompletedFixture(matchId);
  if (!fixture || !["FT", "AET", "PEN"].includes(fixture.status)) {
    return { skipped: true, reason: "match-not-final", matchId };
  }

  const homeGoals = fixture.goals?.home;
  const awayGoals = fixture.goals?.away;
  if (homeGoals === null || homeGoals === undefined || awayGoals === null || awayGoals === undefined) {
    throw new Error(`Finished fixture ${matchId} did not include final goals`);
  }

  const correct = prediction.outcome === actualOutcome(homeGoals, awayGoals);
  const hash = await walletClient.writeContract({
    address: resolverAddress,
    abi: resolverAbi,
    functionName: "resolveMatch",
    args: [BigInt(matchId), correct]
  });
  await publicClient.waitForTransactionReceipt({ hash });

  return {
    skipped: false,
    matchId,
    correct,
    hash,
    score: `${fixture.home.name} ${homeGoals}-${awayGoals} ${fixture.away.name}`
  };
}

export async function resolveDemoMatch(matchId: number, agentCorrect: boolean) {
  const prediction = await publicClient.readContract({
    address: registryAddress,
    abi: registryAbi,
    functionName: "getPrediction",
    args: [BigInt(matchId)]
  });

  if (prediction.resolved) {
    return { skipped: true, reason: "already-resolved", matchId };
  }

  const hash = await walletClient.writeContract({
    address: resolverAddress,
    abi: resolverAbi,
    functionName: "resolveMatch",
    args: [BigInt(matchId), agentCorrect]
  });
  await publicClient.waitForTransactionReceipt({ hash });

  return { skipped: false, matchId, correct: agentCorrect, hash };
}

if (process.argv[1]?.endsWith("resolveMatch.ts")) {
  const matchId = Number(process.env.MATCH_ID);
  if (!Number.isInteger(matchId)) throw new Error("Set MATCH_ID to the API-Football fixture id.");
  const demoCorrect = process.env.DEMO_AGENT_CORRECT;
  const runner =
    demoCorrect === undefined
      ? resolveFinishedMatch(matchId)
      : resolveDemoMatch(matchId, demoCorrect.toLowerCase() !== "false");

  runner
    .then((result) => console.log(JSON.stringify(result, null, 2)))
    .catch((error) => {
      console.error(error);
      process.exitCode = 1;
    });
}
