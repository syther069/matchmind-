export const registryAddress = process.env.NEXT_PUBLIC_REGISTRY as `0x${string}` | undefined;
export const poolAddress = process.env.NEXT_PUBLIC_POOL as `0x${string}` | undefined;
export const resolverAddress = process.env.NEXT_PUBLIC_RESOLVER as `0x${string}` | undefined;

export const registryAbi = [
  {
    type: "function",
    name: "getPrediction",
    stateMutability: "view",
    inputs: [{ name: "matchId", type: "uint256" }],
    outputs: [
      {
        type: "tuple",
        components: [
          { name: "matchId", type: "uint256" },
          { name: "outcome", type: "uint8" },
          { name: "confidence", type: "uint8" },
          { name: "reasoningCID", type: "string" },
          { name: "timestamp", type: "uint256" },
          { name: "resolved", type: "bool" },
          { name: "correct", type: "bool" }
        ]
      }
    ]
  },
  {
    type: "event",
    name: "PredictionSubmitted",
    inputs: [
      { indexed: true, name: "matchId", type: "uint256" },
      { indexed: true, name: "outcome", type: "uint8" },
      { indexed: false, name: "confidence", type: "uint8" },
      { indexed: false, name: "reasoningCID", type: "string" },
      { indexed: false, name: "timestamp", type: "uint256" }
    ]
  },
  {
    type: "event",
    name: "PredictionResolved",
    inputs: [
      { indexed: true, name: "matchId", type: "uint256" },
      { indexed: false, name: "correct", type: "bool" },
      { indexed: false, name: "timestamp", type: "uint256" }
    ]
  }
] as const;

export const poolAbi = [
  {
    type: "function",
    name: "stake",
    stateMutability: "payable",
    inputs: [
      { name: "matchId", type: "uint256" },
      { name: "side", type: "uint8" }
    ],
    outputs: []
  },
  {
    type: "function",
    name: "claim",
    stateMutability: "nonpayable",
    inputs: [{ name: "matchId", type: "uint256" }],
    outputs: [{ name: "reward", type: "uint256" }]
  },
  {
    type: "function",
    name: "previewClaim",
    stateMutability: "view",
    inputs: [
      { name: "matchId", type: "uint256" },
      { name: "user", type: "address" }
    ],
    outputs: [{ name: "", type: "uint256" }]
  },
  {
    type: "event",
    name: "MarketOpened",
    inputs: [
      { indexed: true, name: "matchId", type: "uint256" },
      { indexed: false, name: "kickoff", type: "uint256" }
    ]
  },
  {
    type: "event",
    name: "StakePlaced",
    inputs: [
      { indexed: true, name: "matchId", type: "uint256" },
      { indexed: true, name: "user", type: "address" },
      { indexed: true, name: "side", type: "uint8" },
      { indexed: false, name: "amount", type: "uint256" }
    ]
  },
  {
    type: "event",
    name: "PoolResolved",
    inputs: [
      { indexed: true, name: "matchId", type: "uint256" },
      { indexed: false, name: "agentCorrect", type: "bool" },
      { indexed: false, name: "followTotal", type: "uint256" },
      { indexed: false, name: "fadeTotal", type: "uint256" },
      { indexed: false, name: "protocolFees", type: "uint256" }
    ]
  },
  {
    type: "event",
    name: "RewardClaimed",
    inputs: [
      { indexed: true, name: "matchId", type: "uint256" },
      { indexed: true, name: "user", type: "address" },
      { indexed: false, name: "amount", type: "uint256" }
    ]
  }
] as const;
