const { ethers } = require("ethers");
require("dotenv").config();

const POOL_ABI = [
  "function minStake() view returns (uint256)",
  "function stake(uint256 matchId, uint8 side) payable"
];
const RPC_URL = "https://rpc.xlayer.tech";
const POOL_ADDRESS = process.env.NEXT_PUBLIC_POOL || "0x235491Ff2789Ae6988f361FEF275E829fCbc5A8D";
const MATCH_ID = Number(process.argv[2] || process.env.MATCH_ID || "1");
const SIDE = Number(process.argv[3] || process.env.SIDE || "0");

function requireEnv(name) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

async function main() {
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(requireEnv("PRIVATE_KEY"), provider);
  const pool = new ethers.Contract(POOL_ADDRESS, POOL_ABI, wallet);
  const stakeValue = await pool.minStake();
  const balance = await provider.getBalance(wallet.address);

  if (balance < stakeValue) {
    throw new Error(
      `Insufficient OKB. Wallet ${wallet.address} has ${ethers.formatEther(balance)} OKB; fund at least ${ethers.formatEther(stakeValue)} OKB plus gas, then rerun this script.`
    );
  }

  console.log(`Staking ${ethers.formatEther(stakeValue)} OKB on match ${MATCH_ID}, side ${SIDE}`);
  const tx = await pool.stake(MATCH_ID, SIDE, { value: stakeValue });

  console.log(`Stake submitted: ${tx.hash}`);
  await tx.wait();
  console.log(`Stake confirmed: ${tx.hash}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
