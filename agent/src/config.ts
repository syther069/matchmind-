import "dotenv/config";
import { z } from "zod";
import { defineChain, http, createPublicClient, createWalletClient } from "viem";
import { privateKeyToAccount } from "viem/accounts";

const envSchema = z.object({
  RPC_URL: z.string().url().default("https://rpc.xlayer.tech"),
  PRIVATE_KEY: z.string().regex(/^0x[a-fA-F0-9]{64}$/),
  DEMO_MODE: z.coerce.boolean().default(false),
  ANTHROPIC_API_KEY: z.string().default(""),
  API_FOOTBALL_KEY: z.string().default(""),
  ODDS_API_KEY: z.string().default(""),
  PINATA_JWT: z.string().default(""),
  NEXT_PUBLIC_REGISTRY: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  NEXT_PUBLIC_POOL: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  NEXT_PUBLIC_RESOLVER: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  AGENT_LOOKAHEAD_HOURS: z.coerce.number().int().positive().default(30),
  MIN_CONFIDENCE: z.coerce.number().int().min(1).max(100).default(55)
});

export const env = envSchema.parse(process.env);

if (!env.DEMO_MODE) {
  const missing = [
    ["ANTHROPIC_API_KEY", env.ANTHROPIC_API_KEY],
    ["API_FOOTBALL_KEY", env.API_FOOTBALL_KEY],
    ["ODDS_API_KEY", env.ODDS_API_KEY],
    ["PINATA_JWT", env.PINATA_JWT]
  ].filter(([, value]) => !value);

  if (missing.length > 0) {
    throw new Error(
      `Missing agent API keys: ${missing.map(([name]) => name).join(", ")}. Set DEMO_MODE=true to run without paid APIs.`
    );
  }
}

export const xLayer = defineChain({
  id: 196,
  name: "X Layer",
  nativeCurrency: {
    name: "OKB",
    symbol: "OKB",
    decimals: 18
  },
  rpcUrls: {
    default: {
      http: [env.RPC_URL]
    }
  }
});

export const account = privateKeyToAccount(env.PRIVATE_KEY as `0x${string}`);

export const publicClient = createPublicClient({
  chain: xLayer,
  transport: http(env.RPC_URL)
});

export const walletClient = createWalletClient({
  account,
  chain: xLayer,
  transport: http(env.RPC_URL)
});

export const registryAddress = env.NEXT_PUBLIC_REGISTRY as `0x${string}`;
export const resolverAddress = env.NEXT_PUBLIC_RESOLVER as `0x${string}`;

export const registryAbi = [
  {
    type: "function",
    name: "hasPrediction",
    stateMutability: "view",
    inputs: [{ name: "matchId", type: "uint256" }],
    outputs: [{ name: "", type: "bool" }]
  },
  {
    type: "function",
    name: "submitPrediction",
    stateMutability: "nonpayable",
    inputs: [
      { name: "matchId", type: "uint256" },
      { name: "outcome", type: "uint8" },
      { name: "confidence", type: "uint8" },
      { name: "reasoningCID", type: "string" }
    ],
    outputs: []
  },
  {
    type: "function",
    name: "getPrediction",
    stateMutability: "view",
    inputs: [{ name: "matchId", type: "uint256" }],
    outputs: [
      {
        type: "tuple",
        components: [
          { name: "matchId", type: "uint256" },
          { name: "outcome", type: "uint8" },
          { name: "confidence", type: "uint8" },
          { name: "reasoningCID", type: "string" },
          { name: "timestamp", type: "uint256" },
          { name: "resolved", type: "bool" },
          { name: "correct", type: "bool" }
        ]
      }
    ]
  }
] as const;

export const resolverAbi = [
  {
    type: "function",
    name: "openMarket",
    stateMutability: "nonpayable",
    inputs: [
      { name: "matchId", type: "uint256" },
      { name: "kickoff", type: "uint64" }
    ],
    outputs: []
  },
  {
    type: "function",
    name: "resolveMatch",
    stateMutability: "nonpayable",
    inputs: [
      { name: "matchId", type: "uint256" },
      { name: "agentCorrect", type: "bool" }
    ],
    outputs: []
  }
] as const;
