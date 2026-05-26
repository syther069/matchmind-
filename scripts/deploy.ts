import { ethers } from "hardhat";
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

async function main() {
  const [deployer] = await ethers.getSigners();
  if (!deployer) {
    throw new Error(
      "No deployer wallet found. Set PRIVATE_KEY=0x... in the root .env file and fund that wallet with OKB on X Layer."
    );
  }

  const owner = process.env.OWNER_ADDRESS || deployer.address;
  const agent = process.env.AGENT_ADDRESS || deployer.address;
  const backend = process.env.BACKEND_ADDRESS || deployer.address;
  const feeRecipient = process.env.FEE_RECIPIENT || deployer.address;
  const minStake = ethers.parseEther(process.env.MIN_STAKE_OKB || "0.01");

  console.log("Deploying MatchMind with:");
  console.log({ owner, agent, backend, feeRecipient, minStake: minStake.toString() });

  const Registry = await ethers.getContractFactory("PredictionRegistry");
  const registry = await Registry.deploy(owner, agent);
  await registry.waitForDeployment();

  const Pool = await ethers.getContractFactory("StakingPool");
  const pool = await Pool.deploy(owner, await registry.getAddress(), minStake, feeRecipient);
  await pool.waitForDeployment();

  const Resolver = await ethers.getContractFactory("OracleResolver");
  const resolver = await Resolver.deploy(owner, await registry.getAddress(), await pool.getAddress(), backend);
  await resolver.waitForDeployment();

  const resolverAddress = await resolver.getAddress();
  await (await registry.setResolver(resolverAddress)).wait();
  await (await pool.setResolver(resolverAddress)).wait();

  const deployment = {
    chainId: 196,
    registry: await registry.getAddress(),
    pool: await pool.getAddress(),
    resolver: resolverAddress,
    owner,
    agent,
    backend,
    feeRecipient,
    minStake: minStake.toString()
  };

  mkdirSync("deployments", { recursive: true });
  writeFileSync(join("deployments", "xlayer.json"), JSON.stringify(deployment, null, 2));

  console.log("MatchMind deployed:");
  console.log(deployment);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
