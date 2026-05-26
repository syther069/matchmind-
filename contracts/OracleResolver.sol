// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable2Step, Ownable} from "@openzeppelin/contracts/access/Ownable2Step.sol";
import {PredictionRegistry} from "./PredictionRegistry.sol";
import {StakingPool} from "./StakingPool.sol";

contract OracleResolver is Ownable2Step {
    error ZeroAddress();
    error Unauthorized();

    PredictionRegistry public immutable registry;
    StakingPool public immutable stakingPool;
    address public backend;

    event BackendUpdated(address indexed oldBackend, address indexed newBackend);
    event MatchResolutionSubmitted(uint256 indexed matchId, bool agentCorrect, address indexed backend);
    event MarketConfigured(uint256 indexed matchId, uint256 kickoff, address indexed backend);

    modifier onlyBackend() {
        if (msg.sender != backend) revert Unauthorized();
        _;
    }

    constructor(
        address initialOwner,
        address predictionRegistry,
        address stakingPoolAddress,
        address initialBackend
    ) Ownable(initialOwner) {
        if (
            predictionRegistry == address(0) ||
            stakingPoolAddress == address(0) ||
            initialBackend == address(0)
        ) revert ZeroAddress();

        registry = PredictionRegistry(predictionRegistry);
        stakingPool = StakingPool(stakingPoolAddress);
        backend = initialBackend;
        emit BackendUpdated(address(0), initialBackend);
    }

    function setBackend(address newBackend) external onlyOwner {
        if (newBackend == address(0)) revert ZeroAddress();
        address oldBackend = backend;
        backend = newBackend;
        emit BackendUpdated(oldBackend, newBackend);
    }

    function openMarket(uint256 matchId, uint64 kickoff) external onlyBackend {
        stakingPool.setKickoffTimestamp(matchId, kickoff);
        emit MarketConfigured(matchId, kickoff, msg.sender);
    }

    function resolveMatch(uint256 matchId, bool agentCorrect) external onlyBackend {
        registry.markResolved(matchId, agentCorrect);
        stakingPool.resolvePool(matchId, agentCorrect);
        emit MatchResolutionSubmitted(matchId, agentCorrect, msg.sender);
    }
}
