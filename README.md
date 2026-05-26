# MatchMind - AI Prediction Agent on X Layer

An autonomous AI agent that commits 2026 FIFA World Cup match predictions
on-chain before kickoff. Users follow or fade the agent's picks with real
OKB stakes. Every prediction is permanently verifiable on X Layer mainnet.

## Live Demo
https://matchmind-one.vercel.app

## How It Works
1. AI agent analyzes match data and generates a structured prediction
2. Prediction committed to PredictionRegistry on X Layer before kickoff
3. Users stake OKB to Follow (agent correct) or Fade (agent wrong)
4. Oracle resolves after match - StakingPool distributes winnings

## Contracts - X Layer Mainnet (chainId 196)
| Contract | Address |
|---|---|
| PredictionRegistry | 0xcE7186F84cd7F48124dDADB5d318e7Df06667010 |
| StakingPool | 0x235491Ff2789Ae6988f361FEF275E829fCbc5A8D |
| OracleResolver | 0x8b675449ECa160A891529181Fa7AA4185FB907C5 |

## On-Chain Predictions
| Match | Prediction | Confidence | TX |
|---|---|---|---|
| Brazil vs Argentina | Brazil Win | 73% | [0xcde6...](https://www.oklink.com/xlayer/tx/0xcde68b8d02691d6b6169d551da93787868c6f20b690f613d435a6176e5b5b563) |
| France vs England | Draw | 58% | [0x40c4...](https://www.oklink.com/xlayer/tx/0x40c4254a601b43a46c918cb0a7375c3faf5bc949501e47d9e1168b40ba84fbe1) |
| Portugal vs Morocco | Portugal Win | 81% | [0x7016...](https://www.oklink.com/xlayer/tx/0x70164e5d961dcf28e5c020fd85b6d7ead17d45522077aa6a108f7a72fc8ded40) |

## Stack
Next.js 14, Solidity, Hardhat, wagmi v2, viem, TanStack Query,
Tailwind CSS, X Layer, IPFS (Pinata)

## Setup
```bash
# Install root dependencies
npm install

# Install frontend dependencies
cd frontend && npm install

# Copy env example
cp .env.example .env
# Fill in your keys

# Compile contracts
npx hardhat compile

# Deploy to X Layer
npx hardhat run scripts/deploy.ts --network xlayer

# Run frontend
cd frontend && npm run dev
```

## Hackathon
X Cup Hackathon 2026 - Built on X Layer
Track: AI Agent + Prediction Markets
