import { env } from "./config.js";
import type { Fixture, OddsSnapshot } from "./types.js";

const ODDS_BASE = "https://api.the-odds-api.com/v4";

function normalize(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

export async function fetchOdds(fixture: Fixture): Promise<OddsSnapshot[]> {
  if (env.DEMO_MODE) {
    return [
      {
        bookmaker: "MatchMind Demo Book",
        home: 1.92,
        draw: 3.45,
        away: 4.1,
        lastUpdate: new Date().toISOString()
      }
    ];
  }

  const url = new URL(`${ODDS_BASE}/sports/soccer/odds`);
  url.searchParams.set("apiKey", env.ODDS_API_KEY);
  url.searchParams.set("regions", "uk,eu,us");
  url.searchParams.set("markets", "h2h");
  url.searchParams.set("oddsFormat", "decimal");
  url.searchParams.set("dateFormat", "iso");

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`The Odds API failed: ${response.status} ${await response.text()}`);
  }

  const events = (await response.json()) as any[];
  const home = normalize(fixture.home.name);
  const away = normalize(fixture.away.name);

  const event = events.find((candidate) => {
    const candidateHome = normalize(candidate.home_team || "");
    const candidateAway = normalize(candidate.away_team || "");
    return (
      (candidateHome.includes(home) || home.includes(candidateHome)) &&
      (candidateAway.includes(away) || away.includes(candidateAway))
    );
  });

  if (!event) return [];

  return event.bookmakers.flatMap((bookmaker: any) => {
    const market = bookmaker.markets?.find((m: any) => m.key === "h2h");
    if (!market) return [];

    const snapshot: OddsSnapshot = {
      bookmaker: bookmaker.title,
      lastUpdate: market.last_update
    };

    for (const outcome of market.outcomes || []) {
      const name = normalize(outcome.name);
      if (name.includes(home) || home.includes(name)) snapshot.home = Number(outcome.price);
      if (name.includes(away) || away.includes(name)) snapshot.away = Number(outcome.price);
      if (name === "draw") snapshot.draw = Number(outcome.price);
    }

    return [snapshot];
  });
}
