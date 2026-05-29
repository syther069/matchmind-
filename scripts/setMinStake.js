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
  
  const newMinStake = ethers.parseEther("0.001");
  console.log(`Setting new minimum stake to ${ethers.formatEther(newMinStake)} OKB...`);
  
  const tx = await pool.setMinStake(newMinStake);
  console.log(`Transaction sent: ${tx.hash}`);
  
  await tx.wait();
  console.log("Transaction confirmed. Minimum stake updated successfully.");

  // Optional: update the deployments/xlayer.json file if desired, though the prompt doesn't ask for it
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
