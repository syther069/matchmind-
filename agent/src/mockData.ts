export const MOCK_MATCHES = [
  {
    matchId: 1,
    home: "Brazil",
    away: "Argentina",
    kickoff: Math.floor(Date.now() / 1000) + 2592000,
    prediction: { outcome: 0, confidence: 73, reasoning: "Brazil attacking depth, Argentina transition risk, market edge +5.8%" }
  },
  {
    matchId: 2,
    home: "France",
    away: "England",
    kickoff: Math.floor(Date.now() / 1000) + 2678400,
    prediction: { outcome: 1, confidence: 58, reasoning: "Balanced elite squads, conservative knockout setup, draw edge +4.2%" }
  },
  {
    matchId: 3,
    home: "Portugal",
    away: "Morocco",
    kickoff: Math.floor(Date.now() / 1000) + 2764800,
    prediction: { outcome: 0, confidence: 81, reasoning: "Portugal chance creation, Morocco low-block variance, market edge +4.9%" }
  },
  {
    matchId: 4,
    home: "Spain",
    away: "Germany",
    kickoff: Math.floor(Date.now() / 1000) + 2851200,
    prediction: { outcome: 0, confidence: 76, reasoning: "Spain dominant possession, Germany inconsistent defense, market edge +5.2%" }
  },
  {
    matchId: 5,
    home: "England",
    away: "Netherlands",
    kickoff: Math.floor(Date.now() / 1000) + 2937600,
    prediction: { outcome: 1, confidence: 62, reasoning: "Balanced squad quality, Netherlands transition control, draw edge +3.6%" }
  },
  {
    matchId: 6,
    home: "Brazil",
    away: "France",
    kickoff: Math.floor(Date.now() / 1000) + 3024000,
    prediction: { outcome: 0, confidence: 69, reasoning: "Brazil attacking ceiling, France fullback exposure, market edge +4.1%" }
  }
];
