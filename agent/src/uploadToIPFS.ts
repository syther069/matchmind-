import { env } from "./config.js";
import type { ReasoningArtifact } from "./types.js";

export async function uploadToIPFS(artifact: ReasoningArtifact): Promise<string> {
  if (env.DEMO_MODE) {
    const home = encodeURIComponent(artifact.homeTeam);
    const away = encodeURIComponent(artifact.awayTeam);
    return `demo:${artifact.matchId}:${artifact.outcome}:${artifact.confidence}:${home}:${away}`;
  }

  const body = JSON.stringify({
    pinataContent: artifact,
    pinataMetadata: {
      name: `matchmind-${artifact.matchId}-${artifact.generatedAt}.json`
    }
  });

  const response = await fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.PINATA_JWT}`,
      "Content-Type": "application/json"
    },
    body
  });

  if (!response.ok) {
    throw new Error(`Pinata upload failed: ${response.status} ${await response.text()}`);
  }

  const json = (await response.json()) as { IpfsHash?: string };
  if (!json.IpfsHash) throw new Error("Pinata response did not include IpfsHash");
  return json.IpfsHash;
}
