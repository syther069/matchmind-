import cron from "node-cron";
import { fetchUpcomingMatches } from "./fetchMatches.js";
import { submitPredictionForFixture } from "./submitPrediction.js";

const WINDOWS_HOURS = [24, 6, 1];
const WINDOW_TOLERANCE_MINUTES = 20;

function isInsideRunWindow(kickoffIso: string, targetHours: number) {
  const msUntilKickoff = new Date(kickoffIso).getTime() - Date.now();
  const targetMs = targetHours * 60 * 60 * 1000;
  const toleranceMs = WINDOW_TOLERANCE_MINUTES * 60 * 1000;
  return Math.abs(msUntilKickoff - targetMs) <= toleranceMs;
}

export async function runAgentCycle() {
  const matches = await fetchUpcomingMatches(30);
  const candidates = matches.filter((fixture) =>
    WINDOWS_HOURS.some((hours) => isInsideRunWindow(fixture.kickoff, hours))
  );

  const results = [];
  for (const fixture of candidates) {
    try {
      results.push(await submitPredictionForFixture(fixture));
    } catch (error) {
      results.push({
        skipped: true,
        matchId: fixture.matchId,
        reason: error instanceof Error ? error.message : String(error)
      });
    }
  }

  console.log(
    JSON.stringify(
      {
        ranAt: new Date().toISOString(),
        candidateCount: candidates.length,
        results
      },
      null,
      2
    )
  );
}

if (process.argv.includes("--once")) {
  runAgentCycle().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
} else {
  cron.schedule("*/20 * * * *", () => {
    runAgentCycle().catch((error) => console.error(error));
  });
  console.log("MatchMind agent running every 20 minutes.");
}
