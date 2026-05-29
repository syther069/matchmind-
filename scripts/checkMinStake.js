const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const deploymentPath = path.join(__dirname, "../deployments/xlayer.json");
  if (!fs.existsSync(deploymentPath)) {
    throw new Error(`Deployment file not found: ${deploymentPath}`);
  }
  const deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
  
  const poolAddress = deployment.pool;
  console.log(`Connecting to StakingPool at: ${poolAddress}`);
  
  const StakingPool = await ethers.getContractFactory("StakingPool");
  const pool = StakingPool.attach(poolAddress);
  
  const currentMinStake = await pool.minStake();
  console.log(`Current minimum stake on-chain: ${ethers.formatEther(currentMinStake)} OKB`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
