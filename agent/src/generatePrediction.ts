import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { env } from "./config.js";
import type { MatchContext, PredictionJson } from "./types.js";

const MODEL = "claude-3-5-sonnet-20240620";

const predictionSchema = z.object({
  outcome: z.union([z.literal(0), z.literal(1), z.literal(2)]),
  confidence: z.number().int().min(1).max(100),
  edge: z.number(),
  key_factors: z.array(z.string()).max(12),
  risks: z.array(z.string()).max(12),
  reasoning_summary: z.string().min(20).max(2000)
});

export async function generatePrediction(context: MatchContext): Promise<PredictionJson> {
  if (env.DEMO_MODE) return generateDemoPrediction(context);

  const anthropic = new Anthropic({
    apiKey: env.ANTHROPIC_API_KEY
  });

  const prompt = [
    "You are MatchMind, an autonomous football prediction agent.",
    "Produce a calibrated prediction for the provided match.",
    "Outcome mapping: 0 = HOME_WIN, 1 = DRAW, 2 = AWAY_WIN.",
    "Use fixture data, form, injuries, lineups if present, head-to-head, and bookmaker odds.",
    "Estimate confidence conservatively. Confidence is the probability your selected outcome is correct.",
    "Return strict JSON only. No markdown. No prose outside JSON.",
    "Expected schema:",
    '{"outcome":0,"confidence":73,"edge":11,"key_factors":[],"risks":[],"reasoning_summary":""}',
    "",
    JSON.stringify(context)
  ].join("\n");

  const message = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 1200,
    temperature: 0.1,
    system: "You only emit valid JSON matching the requested schema.",
    messages: [{ role: "user", content: prompt }]
  });

  const text = message.content
    .filter((part): part is Anthropic.TextBlock => part.type === "text")
    .map((part) => part.text)
    .join("")
    .trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error(`Claude returned invalid JSON: ${text}`);
  }

  return predictionSchema.parse(parsed);
}

export const predictionModel = MODEL;

function generateDemoPrediction(context: MatchContext): PredictionJson {
  const seed = context.fixture.matchId % 3;
  const outcome = seed === 0 ? 1 : seed === 1 ? 0 : 2;
  const confidence = seed === 0 ? 61 : seed === 1 ? 72 : 66;

  return {
    outcome,
    confidence,
    edge: seed === 1 ? 10 : 7,
    key_factors: [
      `${context.fixture.home.name} has stronger synthetic recent form.`,
      "Demo odds show a small pricing edge.",
      "The local agent is conservative because no live data is used."
    ],
    risks: [
      "Demo mode does not use live lineups, injuries, odds movement, or paid AI.",
      "Use production API keys before treating predictions as real."
    ],
    reasoning_summary: `Free demo prediction for ${context.fixture.home.name} vs ${context.fixture.away.name}. This local heuristic is generated without Anthropic, API-Football, The Odds API, or Pinata, so you can test the complete on-chain MatchMind flow.`
  };
}
