export type Outcome = 0 | 1 | 2;

export type Team = {
  id: number;
  name: string;
};

export type Fixture = {
  matchId: number;
  league: string;
  kickoff: string;
  venue?: string;
  home: Team;
  away: Team;
  status: string;
  goals?: {
    home: number | null;
    away: number | null;
  };
};

export type MatchContext = {
  fixture: Fixture;
  form: unknown[];
  injuries: unknown[];
  lineups: unknown[];
  headToHead: unknown[];
  odds: OddsSnapshot[];
};

export type OddsSnapshot = {
  bookmaker: string;
  home?: number;
  draw?: number;
  away?: number;
  lastUpdate?: string;
};

export type PredictionJson = {
  outcome: Outcome;
  confidence: number;
  edge: number;
  key_factors: string[];
  risks: string[];
  reasoning_summary: string;
};

export type ReasoningArtifact = PredictionJson & {
  matchId: number;
  kickoff: string;
  homeTeam: string;
  awayTeam: string;
  league: string;
  generatedAt: string;
  model: string;
  odds: OddsSnapshot[];
};
