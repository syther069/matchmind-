import { publicClient, registryAbi, registryAddress, resolverAbi, resolverAddress, walletClient } from "./config.js";
import { fetchMatchContext } from "./fetchMatches.js";
import { fetchOdds } from "./fetchOdds.js";
import { generatePrediction, predictionModel } from "./generatePrediction.js";
import { uploadToIPFS } from "./uploadToIPFS.js";
import type { Fixture, MatchContext, ReasoningArtifact } from "./types.js";
import { env } from "./config.js";

export async function submitPredictionForFixture(fixture: Fixture) {
  const alreadySubmitted = await publicClient.readContract({
    address: registryAddress,
    abi: registryAbi,
    functionName: "hasPrediction",
    args: [BigInt(fixture.matchId)]
  });

  if (alreadySubmitted) {
    return { skipped: true, reason: "already-submitted", matchId: fixture.matchId };
  }

  const partialContext = await fetchMatchContext(fixture);
  const odds = await fetchOdds(fixture);
  const context: MatchContext = { ...partialContext, odds };
  const prediction = await generatePrediction(context);

  if (prediction.confidence < env.MIN_CONFIDENCE) {
    return {
      skipped: true,
      reason: "confidence-below-threshold",
      matchId: fixture.matchId,
      confidence: prediction.confidence
    };
  }

  const artifact: ReasoningArtifact = {
    ...prediction,
    matchId: fixture.matchId,
    kickoff: fixture.kickoff,
    homeTeam: fixture.home.name,
    awayTeam: fixture.away.name,
    league: fixture.league,
    generatedAt: new Date().toISOString(),
    model: predictionModel,
    odds
  };

  const cid = await uploadToIPFS(artifact);
  const submitHash = await walletClient.writeContract({
    address: registryAddress,
    abi: registryAbi,
    functionName: "submitPrediction",
    args: [BigInt(fixture.matchId), prediction.outcome, prediction.confidence, cid]
  });
  await publicClient.waitForTransactionReceipt({ hash: submitHash });

  const kickoff = BigInt(Math.floor(new Date(fixture.kickoff).getTime() / 1000));
  const marketHash = await walletClient.writeContract({
    address: resolverAddress,
    abi: resolverAbi,
    functionName: "openMarket",
    args: [BigInt(fixture.matchId), kickoff]
  });
  await publicClient.waitForTransactionReceipt({ hash: marketHash });

  return {
    skipped: false,
    matchId: fixture.matchId,
    cid,
    submitHash,
    marketHash,
    prediction
  };
}

if (process.argv[1]?.endsWith("submitPrediction.ts")) {
  const fixtureJson = process.env.MATCH_FIXTURE_JSON;
  if (!fixtureJson) throw new Error("Set MATCH_FIXTURE_JSON to a serialized Fixture object.");
  const fixture = JSON.parse(fixtureJson) as Fixture;
  submitPredictionForFixture(fixture)
    .then((result) => console.log(JSON.stringify(result, null, 2)))
    .catch((error) => {
      console.error(error);
      process.exitCode = 1;
    });
}
