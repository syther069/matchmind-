import { env } from "./config.js";
import type { Fixture } from "./types.js";

const API_BASE = "https://v3.football.api-sports.io";

async function apiFootball<T>(path: string, params: Record<string, string | number>) {
  const url = new URL(`${API_BASE}${path}`);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, String(value));

  const response = await fetch(url, {
    headers: {
      "x-apisports-key": env.API_FOOTBALL_KEY
    }
  });

  if (!response.ok) {
    throw new Error(`API-Football ${path} failed: ${response.status} ${await response.text()}`);
  }

  const json = (await response.json()) as { response: T; errors?: unknown };
  return json.response;
}

export async function fetchUpcomingMatches(lookaheadHours = env.AGENT_LOOKAHEAD_HOURS): Promise<Fixture[]> {
  if (env.DEMO_MODE) return demoFixtures();

  const now = new Date();
  const until = new Date(now.getTime() + lookaheadHours * 60 * 60 * 1000);
  const date = now.toISOString().slice(0, 10);
  const nextDate = until.toISOString().slice(0, 10);
  const days = date === nextDate ? [date] : [date, nextDate];

  const fixtures = (
    await Promise.all(
      days.map((day) =>
        apiFootball<any[]>("/fixtures", {
          date: day,
          timezone: "UTC"
        })
      )
    )
  ).flat();

  return fixtures
    .map((item): Fixture => ({
      matchId: Number(item.fixture.id),
      league: `${item.league.name} (${item.league.country})`,
      kickoff: item.fixture.date,
      venue: item.fixture.venue?.name,
      home: {
        id: Number(item.teams.home.id),
        name: item.teams.home.name
      },
      away: {
        id: Number(item.teams.away.id),
        name: item.teams.away.name
      },
      status: item.fixture.status?.short || "NS",
      goals: {
        home: item.goals?.home ?? null,
        away: item.goals?.away ?? null
      }
    }))
    .filter((fixture) => {
      const kickoff = new Date(fixture.kickoff).getTime();
      return fixture.status === "NS" && kickoff > now.getTime() && kickoff <= until.getTime();
    });
}

export async function fetchMatchContext(fixture: Fixture) {
  if (env.DEMO_MODE) {
    return {
      fixture,
      form: [
        { team: fixture.home.name, lastFive: ["W", "W", "D", "W", "L"], goalsFor: 9, goalsAgainst: 5 },
        { team: fixture.away.name, lastFive: ["L", "D", "W", "L", "D"], goalsFor: 5, goalsAgainst: 8 }
      ],
      injuries: [{ team: fixture.away.name, player: "Starting center back", status: "Doubtful" }],
      lineups: [],
      headToHead: [{ summary: `${fixture.home.name} unbeaten in 3 of the last 4 meetings.` }]
    };
  }

  const season = new Date(fixture.kickoff).getUTCFullYear();
  const [homeForm, awayForm, injuries, lineups, headToHead] = await Promise.all([
    apiFootball<unknown[]>("/fixtures", { team: fixture.home.id, last: 5 }),
    apiFootball<unknown[]>("/fixtures", { team: fixture.away.id, last: 5 }),
    apiFootball<unknown[]>("/injuries", { fixture: fixture.matchId }),
    apiFootball<unknown[]>("/fixtures/lineups", { fixture: fixture.matchId }),
    apiFootball<unknown[]>("/fixtures/headtohead", {
      h2h: `${fixture.home.id}-${fixture.away.id}`,
      last: 8,
      season
    })
  ]);

  return {
    fixture,
    form: [...homeForm, ...awayForm],
    injuries,
    lineups,
    headToHead
  };
}

export async function fetchCompletedFixture(matchId: number): Promise<Fixture | null> {
  if (env.DEMO_MODE) {
    const fixture = demoFixtures().find((item) => item.matchId === matchId);
    if (!fixture) return null;
    return {
      ...fixture,
      status: "FT",
      goals: matchId % 2 === 0 ? { home: 2, away: 1 } : { home: 1, away: 1 }
    };
  }

  const [item] = await apiFootball<any[]>("/fixtures", { id: matchId });
  if (!item) return null;

  return {
    matchId: Number(item.fixture.id),
    league: `${item.league.name} (${item.league.country})`,
    kickoff: item.fixture.date,
    venue: item.fixture.venue?.name,
    home: { id: Number(item.teams.home.id), name: item.teams.home.name },
    away: { id: Number(item.teams.away.id), name: item.teams.away.name },
    status: item.fixture.status?.short || "NS",
    goals: {
      home: item.goals?.home ?? null,
      away: item.goals?.away ?? null
    }
  };
}

function demoFixtures(): Fixture[] {
  const now = Date.now();
  const kickoff = (hours: number) => new Date(now + hours * 60 * 60 * 1000).toISOString();

  return [
    {
      matchId: 990001,
      league: "MatchMind Demo League",
      kickoff: kickoff(24),
      venue: "X Layer Arena",
      home: { id: 1, name: "Lagos Lions" },
      away: { id: 2, name: "Seoul Strikers" },
      status: "NS",
      goals: { home: null, away: null }
    },
    {
      matchId: 990002,
      league: "MatchMind Demo League",
      kickoff: kickoff(6),
      venue: "OKB Stadium",
      home: { id: 3, name: "Mumbai City Labs" },
      away: { id: 4, name: "Berlin Chain FC" },
      status: "NS",
      goals: { home: null, away: null }
    },
    {
      matchId: 990003,
      league: "MatchMind Demo League",
      kickoff: kickoff(1),
      venue: "Mainnet Park",
      home: { id: 5, name: "Tokyo Oracles" },
      away: { id: 6, name: "Paris Validators" },
      status: "NS",
      goals: { home: null, away: null }
    }
  ];
}
