<div align="center">

# ⚽ MatchMind

### AI Agent · On-Chain Football Predictions · X Layer

**Follow every call. Fade every call. All accountability, zero trust.**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Hardhat](https://img.shields.io/badge/Hardhat-2.22-F7DC6F?style=flat-square&logo=ethereum&logoColor=black)](https://hardhat.org/)
[![OpenZeppelin](https://img.shields.io/badge/OpenZeppelin-5.0-4E5EE4?style=flat-square&logo=openzeppelin&logoColor=white)](https://openzeppelin.com/)
[![X Layer](https://img.shields.io/badge/Network-X%20Layer-000000?style=flat-square&logo=okx&logoColor=white)](https://www.okx.com/xlayer)
[![License](https://img.shields.io/badge/License-MIT-22C55E?style=flat-square)](./LICENSE)

</div>

---

## What is MatchMind?

MatchMind is a fully on-chain AI prediction agent built for the 2026 World Cup. An autonomous AI agent analyzes real-world football data — team form, historical head-to-head records, live odds, squad strength, and more — and publishes verifiable match predictions directly to smart contracts on the X Layer (OKB) blockchain.

Every prediction is immutably recorded before kickoff. Every outcome is resolved on-chain. There is no hidden model, no post-hoc editing, no cherry-picking of results. Anyone can follow the agent's calls or fade them. The blockchain doesn't lie.

> *"All accountability, zero trust."*

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────────────┐
│                           MATCHMIND SYSTEM                                │
└──────────────────────────────────────────────────────────────────────────┘

  ┌─────────────────────────────────────────────────────────────────────┐
  │                        DATA INGESTION LAYER                          │
  │                                                                       │
  │   ┌───────────────┐   ┌───────────────┐   ┌───────────────────────┐ │
  │   │  API-Football │   │  The Odds API │   │   Historical DB /     │ │
  │   │  (Match Data, │   │  (Live Odds,  │   │   Head-to-Head Stats  │ │
  │   │   Lineups,    │   │   Markets,    │   │                       │ │
  │   │   Form, etc.) │   │   Movement)   │   └───────────────────────┘ │
  │   └───────┬───────┘   └───────┬───────┘                             │
  └───────────┼───────────────────┼─────────────────────────────────────┘
              │                   │
              ▼                   ▼
  ┌───────────────────────────────────────────────────────────────────┐
  │                      AI PREDICTION ENGINE                          │
  │                                                                     │
  │   ┌─────────────────────────────────────────────────────────┐     │
  │   │              Claude (Anthropic API)                       │     │
  │   │                                                           │     │
  │   │   • Aggregates & reasons over multi-source data          │     │
  │   │   • Produces structured prediction + confidence score    │     │
  │   │   • Only publishes if confidence ≥ MIN_CONFIDENCE (55%)  │     │
  │   │   • Generates IPFS-pinned reasoning artifact             │     │
  │   └─────────────────────────────────────────────────────────┘     │
  └──────────────────────────────┬────────────────────────────────────┘
                                 │
              ┌──────────────────▼──────────────────┐
              │           IPFS (Pinata)               │
              │   Stores full prediction reasoning    │
              │   Returns CID → stored on-chain       │
              └──────────────────┬──────────────────┘
                                 │
  ┌──────────────────────────────▼────────────────────────────────────┐
  │                     SMART CONTRACT LAYER (X Layer)                  │
  │                                                                      │
  │   ┌──────────────────────┐  ┌──────────────────┐  ┌─────────────┐ │
  │   │  PredictionRegistry  │  │   StakingPool     │  │OracleResolver│ │
  │   │                      │  │                   │  │             │ │
  │   │  • Records all       │  │  • Manages OKB    │  │  • Resolves │ │
  │   │    predictions with  │  │    stakes from    │  │    outcomes │ │
  │   │    CID + timestamp   │  │    followers      │  │    post-    │ │
  │   │  • Immutable before  │  │  • Distributes    │  │    match    │ │
  │   │    kickoff           │  │    rewards/       │  │  • Pulls    │ │
  │   │  • Public queryable  │  │    penalties      │  │    result   │ │
  │   │                      │  │                   │  │    data     │ │
  │   └──────────────────────┘  └──────────────────┘  └─────────────┘ │
  │                                                                      │
  │   Deployed on X Layer (OKB)  │  OpenZeppelin v5 contracts           │
  └──────────────────────────────────────────────────────────────────────┘
                                 │
  ┌──────────────────────────────▼────────────────────────────────────┐
  │                       FRONTEND / CONSUMER LAYER                    │
  │                                                                      │
  │   ┌───────────────────────────────────────────────────────────┐   │
  │   │   Next.js dApp (via NEXT_PUBLIC_* env vars)               │   │
  │   │   • View live & historical predictions                    │   │
  │   │   • Connect wallet (WalletConnect)                        │   │
  │   │   • Follow or fade predictions with OKB stake             │   │
  │   │   • Browse IPFS reasoning per prediction                  │   │
  │   └───────────────────────────────────────────────────────────┘   │
  └──────────────────────────────────────────────────────────────────────┘
```

### Contract Addresses (X Layer Mainnet)

| Contract | Address |
|---|---|
| PredictionRegistry | `0xcE7186F84cd7F48124dDADB5d318e7Df06667010` |
| StakingPool | `0x235491Ff2789Ae6988f361FEF275E829fCbc5A8D` |
| OracleResolver | `0x8b675449ECa160A891529181Fa7AA4185FB907C5` |

---

## Features

**On-chain prediction accountability** — every AI call is timestamped and locked into the `PredictionRegistry` contract before kickoff. There is no way to alter the record.

**AI-powered analysis** — the Claude model synthesizes match data from multiple sports APIs, computes a confidence score, and writes a detailed reasoning artifact to IPFS. Low-confidence matches are skipped automatically.

**Follow or fade mechanics** — users stake OKB via the `StakingPool` contract either backing or opposing the agent's call. The `OracleResolver` settles outcomes post-match and distributes rewards accordingly.

**Transparent reasoning** — every prediction links to a human-readable IPFS document explaining *why* the agent made the call. No black boxes.

**TypeScript end-to-end** — deployment scripts, tests, and type bindings are all TypeScript with strict mode enabled.

---

## Project Structure

```
matchmind/
├── src/
│   ├── contracts/          # Solidity smart contracts
│   │   ├── PredictionRegistry.sol
│   │   ├── StakingPool.sol
│   │   └── OracleResolver.sol
│   ├── scripts/            # Hardhat deployment & interaction scripts
│   │   ├── deploy.ts
│   │   └── verify.ts
│   └── agent/              # AI prediction agent (TypeScript)
│       ├── index.ts        # Entry point
│       ├── fetchData.ts    # API-Football + Odds API ingestion
│       ├── predict.ts      # Claude API inference
│       └── publish.ts      # IPFS pin + on-chain submission
├── test/                   # Hardhat test suite
├── typechain-types/        # Auto-generated contract typings
├── .env.example            # Environment variable template
├── hardhat.config.ts       # Hardhat + X Layer network config
├── tsconfig.json
└── package.json
```

---

## Prerequisites

- Node.js ≥ 18
- An X Layer wallet with OKB for gas
- API keys for Anthropic, API-Football, The Odds API, and Pinata

---

## Installation

```bash
git clone https://github.com/syther069/matchmind-.git
cd matchmind-
npm install
```

Copy the environment template and fill in your values:

```bash
cp .env.example .env
```

---

## Environment Variables

| Variable | Description |
|---|---|
| `RPC_URL` | X Layer RPC endpoint (`https://rpc.xlayer.tech`) |
| `PRIVATE_KEY` | Deployer wallet private key |
| `OWNER_ADDRESS` | Contract owner address |
| `AGENT_ADDRESS` | Address the AI agent signs transactions from |
| `BACKEND_ADDRESS` | Backend service wallet for oracle resolution |
| `FEE_RECIPIENT` | Address that receives protocol fees |
| `MIN_STAKE_OKB` | Minimum stake amount in OKB (default `0.01`) |
| `PREDICTION_REGISTRY_ADDRESS` | Deployed `PredictionRegistry` contract address |
| `STAKING_POOL_ADDRESS` | Deployed `StakingPool` contract address |
| `ORACLE_RESOLVER_ADDRESS` | Deployed `OracleResolver` contract address |
| `NEXT_PUBLIC_REGISTRY` | Frontend-facing registry address |
| `NEXT_PUBLIC_POOL` | Frontend-facing staking pool address |
| `NEXT_PUBLIC_RESOLVER` | Frontend-facing resolver address |
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | WalletConnect project ID for dApp |
| `NEXT_PUBLIC_FROM_BLOCK` | Block number to index events from |
| `NEXT_PUBLIC_IPFS_GATEWAY` | IPFS gateway URL (e.g. Pinata) |
| `ANTHROPIC_API_KEY` | Claude API key for the AI prediction engine |
| `API_FOOTBALL_KEY` | API-Football key for match data |
| `ODDS_API_KEY` | The Odds API key for live market data |
| `PINATA_JWT` | Pinata JWT for IPFS pinning |
| `MIN_CONFIDENCE` | Minimum confidence score (0–100) to publish a prediction (default `55`) |

---

## Usage

### Compile contracts

```bash
npm run compile
```

### Run tests

```bash
npm test
```

### Check coverage

```bash
npm run coverage
```

### Deploy to X Layer

```bash
npm run deploy:xlayer
```

### Verify contracts

```bash
npm run verify:xlayer
```

### Run the AI agent

```bash
npx ts-node src/agent/index.ts
```

The agent will fetch upcoming World Cup fixtures, run predictions through Claude, pin reasoning to IPFS, and submit any calls that meet the `MIN_CONFIDENCE` threshold to the `PredictionRegistry` contract.

---

## How It Works

**1. Data ingestion** — The agent polls API-Football for upcoming fixtures and The Odds API for current betting markets. It assembles team form, head-to-head history, expected lineups, and odds movement into a structured context object.

**2. AI inference** — The context is sent to Claude via the Anthropic API. Claude produces a prediction (home win / draw / away win), a confidence score, and a detailed natural-language reasoning explanation.

**3. Confidence gate** — If the confidence score is below `MIN_CONFIDENCE` (default 55%), the prediction is discarded. Only high-conviction calls make it on-chain.

**4. IPFS publication** — The full reasoning document is pinned to IPFS via Pinata. The returned CID is stored alongside the prediction.

**5. On-chain registration** — The agent wallet calls `PredictionRegistry.registerPrediction(matchId, outcome, confidence, ipfsCid)`. The contract locks the record and emits an event.

**6. Staking** — Before kickoff, users interact with the `StakingPool` to stake OKB either following or fading the agent's call.

**7. Resolution** — After the match, the `OracleResolver` fetches the result, calls `resolve()`, and the `StakingPool` distributes winnings. The agent's on-chain track record is permanently updated.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Smart Contracts | Solidity, OpenZeppelin v5, Hardhat |
| Contract Testing | Chai, Hardhat test runner, solidity-coverage |
| Type Safety | TypeScript 5.5 (strict), TypeChain (ethers-v6) |
| AI Engine | Anthropic Claude API |
| Data Sources | API-Football, The Odds API |
| Decentralized Storage | IPFS via Pinata |
| Blockchain Network | X Layer (OKX EVM L2, OKB gas token) |
| Frontend | Next.js, WalletConnect |

---

## Security Notes

- **Never commit your `.env` file.** It contains private keys and API secrets. The `.env.example` is the only template that belongs in version control.
- The agent wallet (`AGENT_ADDRESS`) should hold only enough OKB for gas. Keep significant funds in a separate cold wallet.
- Contract ownership and agent permissions are separated — the `OWNER_ADDRESS` controls admin functions while `AGENT_ADDRESS` is limited to prediction submission.
- All prediction submissions are validated for match ID existence and pre-kickoff timing on-chain.

---

## Contributing

Pull requests are welcome. For significant changes, please open an issue first to discuss what you'd like to change. Make sure tests pass and coverage does not regress before submitting.

---

## License

[MIT](./LICENSE) © 2026 syther069
