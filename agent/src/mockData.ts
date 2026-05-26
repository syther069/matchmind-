export const MOCK_MATCHES = [
  {
    matchId: 1,
    home: "Brazil",
    away: "Argentina",
    kickoff: Math.floor(Date.now() / 1000) + 86400,
    prediction: { outcome: 0, confidence: 73, reasoning: "Brazil 5-match unbeaten run, Messi injury doubt, market edge +6.1%" }
  },
  {
    matchId: 2,
    home: "France",
    away: "England",
    kickoff: Math.floor(Date.now() / 1000) + 172800,
    prediction: { outcome: 1, confidence: 58, reasoning: "Both teams qualified, H2H favors draw, low motivation match" }
  },
  {
    matchId: 3,
    home: "Portugal",
    away: "Morocco",
    kickoff: Math.floor(Date.now() / 1000) + 259200,
    prediction: { outcome: 0, confidence: 81, reasoning: "Ronaldo in form, Morocco poor away record, market edge +8.8%" }
  }
];
