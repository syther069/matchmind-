const fs = require("fs");
const path = require("path");

const agentRunPath = path.resolve(__dirname, "../agent-run.txt");
const marketDataPath = path.resolve(__dirname, "../frontend/hooks/useMarketData.ts");
const matchByName = new Map([
  ["Brazil vs Argentina", { matchId: 1, placeholder: "pending:matchmind:brazil-argentina" }],
  ["France vs England", { matchId: 2, placeholder: "pending:matchmind:france-england" }],
  ["Portugal vs Morocco", { matchId: 3, placeholder: "pending:matchmind:portugal-morocco" }],
  ["Spain vs Germany", { matchId: 4, placeholder: "pending:matchmind:spain-germany" }],
  ["England vs Netherlands", { matchId: 5, placeholder: "pending:matchmind:england-netherlands" }],
  ["Brazil vs France", { matchId: 6, placeholder: "pending:matchmind:brazil-france" }]
]);

if (!fs.existsSync(agentRunPath)) {
  throw new Error(`Missing agent output file: ${agentRunPath}`);
}

const output = fs.readFileSync(agentRunPath, "utf8");
const cids = new Map();
const hashes = new Map();
let currentMatchId;

for (const line of output.split(/\r?\n/)) {
  const processing = line.match(/^Processing:\s+(.+)$/);

  if (processing) {
    currentMatchId = matchByName.get(processing[1])?.matchId;
    continue;
  }

  const cid = line.match(/^IPFS CID:\s+(\S+)$/);

  if (cid && currentMatchId) {
    cids.set(currentMatchId, cid[1]);
    continue;
  }

  const committed = line.match(/match\s+(\d+).*tx:\s+(0x[a-fA-F0-9]{64})/);

  if (committed) {
    hashes.set(Number(committed[1]), committed[2]);
  }
}

for (const { matchId } of matchByName.values()) {
  if (!cids.has(matchId)) throw new Error(`Could not find IPFS CID for match ${matchId}`);
  if (!hashes.has(matchId)) throw new Error(`Could not find prediction tx hash for match ${matchId}`);
}

let marketData = fs.readFileSync(marketDataPath, "utf8");

for (const { matchId, placeholder } of matchByName.values()) {
  marketData = marketData.replace(placeholder, cids.get(matchId));
}

fs.writeFileSync(marketDataPath, marketData);

console.log("Updated frontend/hooks/useMarketData.ts with real CIDs:");
for (const { matchId } of matchByName.values()) {
  console.log(`match ${matchId} CID: ${cids.get(matchId)}`);
}

console.log("Prediction transaction hashes:");
for (const { matchId } of matchByName.values()) {
  console.log(`match ${matchId} tx: ${hashes.get(matchId)}`);
}
