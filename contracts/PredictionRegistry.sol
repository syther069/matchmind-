// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable2Step, Ownable} from "@openzeppelin/contracts/access/Ownable2Step.sol";

contract PredictionRegistry is Ownable2Step {
    enum Outcome {
        HOME_WIN,
        DRAW,
        AWAY_WIN
    }

    struct Prediction {
        uint256 matchId;
        uint8 outcome;
        uint8 confidence;
        string reasoningCID;
        uint256 timestamp;
        bool resolved;
        bool correct;
    }

    error ZeroAddress();
    error Unauthorized();
    error PredictionExists();
    error PredictionMissing();
    error AlreadyResolved();
    error InvalidOutcome();
    error InvalidConfidence();
    error EmptyCID();

    address public agent;
    address public resolver;

    mapping(uint256 matchId => Prediction prediction) private predictions;
    mapping(uint256 matchId => bool exists) public hasPrediction;

    event AgentUpdated(address indexed oldAgent, address indexed newAgent);
    event ResolverUpdated(address indexed oldResolver, address indexed newResolver);
    event PredictionSubmitted(
        uint256 indexed matchId,
        uint8 indexed outcome,
        uint8 confidence,
        string reasoningCID,
        uint256 timestamp
    );
    event PredictionResolved(uint256 indexed matchId, bool correct, uint256 timestamp);

    modifier onlyAgent() {
        if (msg.sender != agent) revert Unauthorized();
        _;
    }

    modifier onlyResolver() {
        if (msg.sender != resolver) revert Unauthorized();
        _;
    }

    constructor(address initialOwner, address initialAgent) Ownable(initialOwner) {
        if (initialAgent == address(0)) revert ZeroAddress();
        agent = initialAgent;
        emit AgentUpdated(address(0), initialAgent);
    }

    function setAgent(address newAgent) external onlyOwner {
        if (newAgent == address(0)) revert ZeroAddress();
        address oldAgent = agent;
        agent = newAgent;
        emit AgentUpdated(oldAgent, newAgent);
    }

    function setResolver(address newResolver) external onlyOwner {
        if (newResolver == address(0)) revert ZeroAddress();
        address oldResolver = resolver;
        resolver = newResolver;
        emit ResolverUpdated(oldResolver, newResolver);
    }

    function submitPrediction(
        uint256 matchId,
        uint8 outcome,
        uint8 confidence,
        string calldata reasoningCID
    ) external onlyAgent {
        if (hasPrediction[matchId]) revert PredictionExists();
        if (outcome > uint8(Outcome.AWAY_WIN)) revert InvalidOutcome();
        if (confidence == 0 || confidence > 100) revert InvalidConfidence();
        if (bytes(reasoningCID).length == 0) revert EmptyCID();

        predictions[matchId] = Prediction({
            matchId: matchId,
            outcome: outcome,
            confidence: confidence,
            reasoningCID: reasoningCID,
            timestamp: block.timestamp,
            resolved: false,
            correct: false
        });
        hasPrediction[matchId] = true;

        emit PredictionSubmitted(matchId, outcome, confidence, reasoningCID, block.timestamp);
    }

    function markResolved(uint256 matchId, bool correct) external onlyResolver {
        if (!hasPrediction[matchId]) revert PredictionMissing();

        Prediction storage prediction = predictions[matchId];
        if (prediction.resolved) revert AlreadyResolved();

        prediction.resolved = true;
        prediction.correct = correct;

        emit PredictionResolved(matchId, correct, block.timestamp);
    }

    function getPrediction(uint256 matchId) external view returns (Prediction memory) {
        if (!hasPrediction[matchId]) revert PredictionMissing();
        return predictions[matchId];
    }
}
