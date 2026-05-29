const { ethers } = require("ethers");
require("dotenv").config();

const RPC_URL = process.env.RPC_URL || "https://rpc.xlayer.tech";
const REGISTRY_ADDRESS = process.env.REGISTRY_ADDRESS || "0xcE7186F84cd7F48124dDADB5d318e7Df06667010";
const POOL_ADDRESS = process.env.POOL_ADDRESS || "0x235491Ff2789Ae6988f361FEF275E829fCbc5A8D";
const FROM_BLOCK = BigInt(process.env.FROM_BLOCK || "60850360");

const REGISTRY_ABI = [
  "function hasPrediction(uint256 matchId) view returns (bool)",
  "function getPrediction(uint256 matchId) view returns (tuple(uint256 matchId,uint8 outcome,uint8 confidence,string reasoningCID,uint256 timestamp,bool resolved,bool correct))",
  "event PredictionSubmitted(uint256 indexed matchId,uint8 indexed outcome,uint8 confidence,string reasoningCID,uint256 timestamp)"
];

const POOL_ABI = [
  "function pools(uint256 matchId) view returns (uint128 followTotal,uint128 fadeTotal,uint64 kickoff,bool resolved,bool agentCorrect,uint128 protocolFees)"
];

const TARGET_MATCH_IDS = [1, 2, 3, 4, 5, 6];

async function collectPredictionIds(registry, provider) {
  const latest = BigInt(await provider.getBlockNumber());
  const ids = new Set();
  const filter = registry.filters.PredictionSubmitted();
  const step = 100n;
  let cursor = FROM_BLOCK;

  while (cursor <= latest) {
    const toBlock = cursor + step - 1n < latest ? cursor + step - 1n : latest;
    const logs = await registry.queryFilter(filter, cursor, toBlock);
    for (const log of logs) {
      ids.add(Number(log.args.matchId));
    }
    cursor = toBlock + 1n;
  }

  return [...ids].sort((a, b) => a - b);
}

async function main() {
  const provider = new ethers.JsonRpcProvider(RPC_URL, 196);
  const registry = new ethers.Contract(REGISTRY_ADDRESS, REGISTRY_ABI, provider);
  const pool = new ethers.Contract(POOL_ADDRESS, POOL_ABI, provider);
  const now = Math.floor(Date.now() / 1000);

  if (process.env.SCAN_PREDICTION_EVENTS === "true") {
    const existingIds = await collectPredictionIds(registry, provider);
    console.log(`Existing prediction IDs from events: ${existingIds.length ? existingIds.join(", ") : "none found"}`);
  }

  const existingTargetIds = [];
  for (const matchId of TARGET_MATCH_IDS) {
    const exists = await registry.hasPrediction(matchId);
    if (exists) existingTargetIds.push(matchId);
    let prediction;
    if (exists) {
      prediction = await registry.getPrediction(matchId);
    }

    const poolState = await pool.pools(matchId);
    const kickoff = Number(poolState.kickoff);
    const poolExists = kickoff > 0;
    const open = poolExists && !poolState.resolved && now < kickoff;

    console.log("");
    console.log(`Match ${matchId}`);
    console.log(`Prediction exists: ${exists}`);
    if (prediction) {
      console.log(`Prediction outcome: ${prediction.outcome}`);
      console.log(`Prediction confidence: ${prediction.confidence}`);
      console.log(`Prediction CID: ${prediction.reasoningCID}`);
    }
    console.log(`Pool exists: ${poolExists}`);
    console.log(`Kickoff timestamp: ${kickoff || "not set"}`);
    console.log(`Pool open: ${open}`);
    console.log(`Pool resolved: ${poolState.resolved}`);
    console.log(`Follow total: ${ethers.formatEther(poolState.followTotal)} OKB`);
    console.log(`Fade total: ${ethers.formatEther(poolState.fadeTotal)} OKB`);
  }

  console.log("");
  console.log(`Existing configured prediction IDs: ${existingTargetIds.length ? existingTargetIds.join(", ") : "none"}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
