import { MOCK_MATCHES } from "./mockData";
import { ethers } from "ethers";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const REGISTRY_ABI = [
  "function submitPrediction(uint256 matchId, uint8 outcome, uint8 confidence, string calldata reasoningCID) external"
];

function requireEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    console.error(`Missing required environment variable: ${name}`);
    process.exit(1);
  }

  return value;
}

async function uploadToIPFS(prediction: any, pinataJwt: string): Promise<string> {
  const res = await fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${pinataJwt}`
    },
    body: JSON.stringify({ pinataContent: prediction })
  });

  if (!res.ok) {
    throw new Error(`Pinata upload failed: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();

  if (!data.IpfsHash) {
    throw new Error("Pinata upload response did not include IpfsHash");
  }

  return data.IpfsHash;
}

async function runAgent() {
  const pinataJwt = requireEnv("PINATA_JWT");
  const privateKey = requireEnv("PRIVATE_KEY");
  const registryAddress = requireEnv("REGISTRY_ADDRESS");

  const provider = new ethers.JsonRpcProvider("https://rpc.xlayer.tech");
  const wallet = new ethers.Wallet(privateKey, provider);
  const contract = new ethers.Contract(
    registryAddress,
    REGISTRY_ABI,
    wallet
  );

  for (const match of MOCK_MATCHES) {
    console.log(`Processing: ${match.home} vs ${match.away}`);
    
    const cid = await uploadToIPFS(match.prediction, pinataJwt);
    console.log(`IPFS CID: ${cid}`);

    const tx = await contract.submitPrediction(
      match.matchId,
      match.prediction.outcome,
      match.prediction.confidence,
      cid
    );
    await tx.wait();
    console.log(`✓ Prediction committed for match ${match.matchId} — tx: ${tx.hash}`);
  }
}

runAgent().catch(console.error);
