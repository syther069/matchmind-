const { ethers } = require("ethers");
require("dotenv").config();

const RPC_URL = process.env.RPC_URL || "https://rpc.xlayer.tech";
const REGISTRY_ADDRESS = process.env.REGISTRY_ADDRESS || "0xcE7186F84cd7F48124dDADB5d318e7Df06667010";
const RESOLVER_ADDRESS = process.env.RESOLVER_ADDRESS || "0x8b675449ECa160A891529181Fa7AA4185FB907C5";

const REGISTRY_ABI = [
  "function agent() view returns (address)",
  "function hasPrediction(uint256 matchId) view returns (bool)",
  "function getPrediction(uint256 matchId) view returns (tuple(uint256 matchId,uint8 outcome,uint8 confidence,string reasoningCID,uint256 timestamp,bool resolved,bool correct))",
  "function submitPrediction(uint256 matchId,uint8 outcome,uint8 confidence,string reasoningCID) external",
  "event PredictionSubmitted(uint256 indexed matchId,uint8 indexed outcome,uint8 confidence,string reasoningCID,uint256 timestamp)"
];

const RESOLVER_ABI = [
  "function backend() view returns (address)",
  "function openMarket(uint256 matchId,uint64 kickoff) external"
];

const MARKETS = [
  { matchId: 1, home: "Brazil", away: "Argentina", outcome: 0, confidence: 73 },
  { matchId: 2, home: "France", away: "England", outcome: 1, confidence: 58 },
  { matchId: 3, home: "Portugal", away: "Morocco", outcome: 0, confidence: 81 },
  { matchId: 4, home: "Spain", away: "Germany", outcome: 0, confidence: 76 },
  { matchId: 5, home: "England", away: "Netherlands", outcome: 1, confidence: 62 },
  { matchId: 6, home: "Brazil", away: "France", outcome: 0, confidence: 69 }
];

function requireEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

function reasoningCid(market) {
  return `demo:${market.matchId}:${market.outcome}:${market.confidence}:${encodeURIComponent(market.home)}:${encodeURIComponent(market.away)}`;
}

async function ensurePrediction(registry, walletAddress, market) {
  const exists = await registry.hasPrediction(market.matchId);
  if (exists) {
    const prediction = await registry.getPrediction(market.matchId);
    console.log(`Prediction exists: matchId ${market.matchId}, outcome ${prediction.outcome}, confidence ${prediction.confidence}`);
    return;
  }

  const agent = await registry.agent();
  if (agent.toLowerCase() !== walletAddress.toLowerCase()) {
    throw new Error(
      `Prediction ${market.matchId} is missing. Connect the agent wallet (${agent}) or submit the prediction before opening this market.`
    );
  }

  const tx = await registry.submitPrediction(market.matchId, market.outcome, market.confidence, reasoningCid(market));
  console.log(`Submitting prediction ${market.matchId}: ${tx.hash}`);
  await tx.wait();
  console.log(`Prediction submitted: matchId ${market.matchId}`);
}

async function main() {
  const provider = new ethers.JsonRpcProvider(RPC_URL, 196);
  const network = await provider.getNetwork();
  if (network.chainId !== 196n) {
    throw new Error(`Wrong network: expected X Layer chainId 196, got ${network.chainId.toString()}`);
  }

  const wallet = new ethers.Wallet(requireEnv("PRIVATE_KEY"), provider);
  const registry = new ethers.Contract(REGISTRY_ADDRESS, REGISTRY_ABI, wallet);
  const resolver = new ethers.Contract(RESOLVER_ADDRESS, RESOLVER_ABI, wallet);
  const backend = await resolver.backend();

  if (backend.toLowerCase() !== wallet.address.toLowerCase()) {
    throw new Error(`Connected wallet ${wallet.address} is not resolver backend ${backend}; it cannot open markets.`);
  }

  for (const market of MARKETS) {
    await ensurePrediction(registry, wallet.address, market);
  }

  const now = Math.floor(Date.now() / 1000);
  const firstKickoff = now + 30 * 24 * 60 * 60;

  for (const [index, market] of MARKETS.entries()) {
    const kickoff = firstKickoff + index * 24 * 60 * 60;
    const tx = await resolver.openMarket(market.matchId, kickoff);
    await tx.wait();
    console.log("Market opened:");
    console.log(`matchId: ${market.matchId}`);
    console.log(`kickoff: ${kickoff}`);
    console.log(`transaction hash: ${tx.hash}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
