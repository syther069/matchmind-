import { run } from "hardhat";
import { readFileSync } from "node:fs";

type Deployment = {
  registry: string;
  pool: string;
  resolver: string;
  owner: string;
  agent: string;
  backend: string;
  feeRecipient: string;
  minStake: string;
};

async function verify(address: string, constructorArguments: unknown[]) {
  try {
    await run("verify:verify", { address, constructorArguments });
    console.log(`Verified ${address}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.toLowerCase().includes("already verified")) {
      console.log(`Already verified ${address}`);
      return;
    }
    throw error;
  }
}

async function main() {
  const deployment = JSON.parse(readFileSync("deployments/xlayer.json", "utf8")) as Deployment;

  await verify(deployment.registry, [deployment.owner, deployment.agent]);
  await verify(deployment.pool, [
    deployment.owner,
    deployment.registry,
    deployment.minStake,
    deployment.feeRecipient
  ]);
  await verify(deployment.resolver, [
    deployment.owner,
    deployment.registry,
    deployment.pool,
    deployment.backend
  ]);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
