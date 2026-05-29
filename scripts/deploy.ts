import { ethers } from "hardhat";
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

async function main() {
  const [deployer] = await ethers.getSigners();
  if (!deployer) {
    throw new Error(
      "No deployer wallet found. Set PRIVATE_KEY=0x... in the root .env file and fund that wallet with OKB for X Layer gas."
    );
  }

  const deployerAddress = deployer.address;
  const owner = process.env.OWNER_ADDRESS || deployerAddress;
  const agent = process.env.AGENT_ADDRESS || deployerAddress;
  const backend = process.env.BACKEND_ADDRESS || deployerAddress;
  const feeRecipient = process.env.FEE_RECIPIENT || deployerAddress;
  const minStake = ethers.parseEther(process.env.MIN_STAKE_OKB || "0.001");

  console.log("Deploying MatchMind native OKB markets with:");
  console.log({
    owner,
    agent,
    backend,
    feeRecipient,
    minStake: minStake.toString()
  });

  const Registry = await ethers.getContractFactory("PredictionRegistry");
  const registry = await Registry.deploy(owner, agent);
  await registry.waitForDeployment();

  const StakingPool = await ethers.getContractFactory("StakingPool");
  const pool = await StakingPool.deploy(
    await registry.getAddress(),
    owner,
    agent,
    backend,
    feeRecipient,
    minStake
  );
  await pool.waitForDeployment();

  const Resolver = await ethers.getContractFactory("OracleResolver");
  const resolver = await Resolver.deploy(owner, await registry.getAddress(), await pool.getAddress(), backend);
  await resolver.waitForDeployment();

  const registryAddress = await registry.getAddress();
  const poolAddress = await pool.getAddress();
  const resolverAddress = await resolver.getAddress();

  await (await registry.setResolver(resolverAddress)).wait();
  await (await pool.setResolver(resolverAddress)).wait();

  const deployment = {
    chainId: 196,
    registry: registryAddress,
    pool: poolAddress,
    resolver: resolverAddress,
    owner,
    agent,
    backend,
    feeRecipient,
    minStake: minStake.toString(),
    stakingToken: "OKB",
    stakingTokenDecimals: 18
  };

  mkdirSync("deployments", { recursive: true });
  writeFileSync(join("deployments", "xlayer.json"), JSON.stringify(deployment, null, 2));

  console.log("MatchMind native OKB deployment saved to deployments/xlayer.json:");
  console.log(deployment);
  console.log("Frontend environment values:");
  console.log(`NEXT_PUBLIC_REGISTRY=${registryAddress}`);
  console.log(`NEXT_PUBLIC_POOL=${poolAddress}`);
  console.log(`NEXT_PUBLIC_RESOLVER=${resolverAddress}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
