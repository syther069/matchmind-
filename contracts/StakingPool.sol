// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable2Step, Ownable} from "@openzeppelin/contracts/access/Ownable2Step.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface IPredictionRegistry {
    function hasPrediction(uint256 matchId) external view returns (bool);
}

contract StakingPool is Ownable2Step, ReentrancyGuard {
    enum Side {
        Follow,
        Fade
    }

    struct Pool {
        uint128 followTotal;
        uint128 fadeTotal;
        uint64 kickoff;
        bool resolved;
        bool agentCorrect;
        uint128 protocolFees;
    }

    struct StakeInfo {
        uint128 followAmount;
        uint128 fadeAmount;
        bool claimed;
    }

    error ZeroAddress();
    error InvalidKickoff();
    error MarketMissing();
    error MarketClosed();
    error PoolResolvedAlready();
    error PoolNotResolved();
    error PredictionMissing();
    error StakeTooSmall();
    error NothingToClaim();
    error AlreadyClaimed();
    error Unauthorized();
    error ValueTooLarge();
    error TransferFailed();

    uint16 public constant PROTOCOL_FEE_BPS = 200;
    uint16 public constant BPS_DENOMINATOR = 10_000;
    uint256 public constant MIN_STAKE = 0.001 ether;

    IPredictionRegistry public immutable registry;
    uint256 public minStake;
    uint256 public accruedProtocolFees;
    address public resolver;
    address public feeRecipient;

    mapping(uint256 matchId => Pool pool) public pools;
    mapping(uint256 matchId => mapping(address user => StakeInfo stakeInfo)) public stakes;

    event ResolverUpdated(address indexed oldResolver, address indexed newResolver);
    event FeeRecipientUpdated(address indexed oldFeeRecipient, address indexed newFeeRecipient);
    event MinStakeUpdated(uint256 oldMinStake, uint256 newMinStake);
    event MarketOpened(uint256 indexed matchId, uint256 kickoff);
    event StakePlaced(uint256 indexed matchId, address indexed user, Side indexed side, uint256 amount);
    event PoolResolved(
        uint256 indexed matchId,
        bool agentCorrect,
        uint256 followTotal,
        uint256 fadeTotal,
        uint256 protocolFees
    );
    event RewardClaimed(uint256 indexed matchId, address indexed user, uint256 amount);
    event FeesWithdrawn(address indexed recipient, uint256 amount);

    modifier onlyResolver() {
        if (msg.sender != resolver) revert Unauthorized();
        _;
    }

    constructor(
        address predictionRegistry,
        address initialOwner,
        address,
        address,
        address initialFeeRecipient,
        uint256 initialMinStake
    ) Ownable(initialOwner) {
        if (
            predictionRegistry == address(0) ||
            initialFeeRecipient == address(0)
        ) revert ZeroAddress();
        registry = IPredictionRegistry(predictionRegistry);
        minStake = initialMinStake == 0 ? MIN_STAKE : initialMinStake;
        feeRecipient = initialFeeRecipient;
        emit FeeRecipientUpdated(address(0), initialFeeRecipient);
        emit MinStakeUpdated(0, minStake);
    }

    function setResolver(address newResolver) external onlyOwner {
        if (newResolver == address(0)) revert ZeroAddress();
        address oldResolver = resolver;
        resolver = newResolver;
        emit ResolverUpdated(oldResolver, newResolver);
    }

    function setFeeRecipient(address newFeeRecipient) external onlyOwner {
        if (newFeeRecipient == address(0)) revert ZeroAddress();
        address oldFeeRecipient = feeRecipient;
        feeRecipient = newFeeRecipient;
        emit FeeRecipientUpdated(oldFeeRecipient, newFeeRecipient);
    }

    function setMinStake(uint256 newMinStake) external onlyOwner {
        if (newMinStake < MIN_STAKE) revert StakeTooSmall();
        uint256 oldMinStake = minStake;
        minStake = newMinStake;
        emit MinStakeUpdated(oldMinStake, newMinStake);
    }

    function setKickoffTimestamp(uint256 matchId, uint64 kickoff) external onlyResolver {
        if (!registry.hasPrediction(matchId)) revert PredictionMissing();
        if (kickoff <= block.timestamp) revert InvalidKickoff();

        Pool storage pool = pools[matchId];
        if (pool.kickoff != 0 && block.timestamp >= pool.kickoff) revert MarketClosed();
        if (pool.resolved) revert PoolResolvedAlready();

        pool.kickoff = kickoff;
        emit MarketOpened(matchId, kickoff);
    }

    function stake(uint256 matchId, Side side) external payable nonReentrant {
        Pool storage pool = pools[matchId];
        if (pool.kickoff == 0) revert MarketMissing();
        if (block.timestamp >= pool.kickoff) revert MarketClosed();
        if (pool.resolved) revert PoolResolvedAlready();
        uint256 amount = msg.value;
        if (amount < minStake) revert StakeTooSmall();

        uint128 stakeAmount = _toUint128(amount);
        StakeInfo storage userStake = stakes[matchId][msg.sender];

        if (side == Side.Follow) {
            pool.followTotal += stakeAmount;
            userStake.followAmount += stakeAmount;
        } else {
            pool.fadeTotal += stakeAmount;
            userStake.fadeAmount += stakeAmount;
        }

        emit StakePlaced(matchId, msg.sender, side, amount);
    }

    function resolvePool(uint256 matchId, bool agentCorrect) external onlyResolver {
        Pool storage pool = pools[matchId];
        if (pool.kickoff == 0) revert MarketMissing();
        if (pool.resolved) revert PoolResolvedAlready();

        pool.resolved = true;
        pool.agentCorrect = agentCorrect;

        uint256 winnerTotal = agentCorrect ? pool.followTotal : pool.fadeTotal;
        uint256 loserTotal = agentCorrect ? pool.fadeTotal : pool.followTotal;
        uint256 fee = winnerTotal == 0 ? loserTotal : (loserTotal * PROTOCOL_FEE_BPS) / BPS_DENOMINATOR;
        pool.protocolFees = _toUint128(fee);
        accruedProtocolFees += fee;

        emit PoolResolved(matchId, agentCorrect, pool.followTotal, pool.fadeTotal, fee);
    }

    function claim(uint256 matchId) external nonReentrant returns (uint256 reward) {
        Pool storage pool = pools[matchId];
        if (!pool.resolved) revert PoolNotResolved();

        StakeInfo storage userStake = stakes[matchId][msg.sender];
        if (userStake.claimed) revert AlreadyClaimed();

        uint256 userWinnerStake = pool.agentCorrect ? userStake.followAmount : userStake.fadeAmount;
        if (userWinnerStake == 0) revert NothingToClaim();

        userStake.claimed = true;

        uint256 winnerTotal = pool.agentCorrect ? pool.followTotal : pool.fadeTotal;
        uint256 loserTotal = pool.agentCorrect ? pool.fadeTotal : pool.followTotal;
        uint256 distributableLosers = loserTotal - pool.protocolFees;
        reward = userWinnerStake + ((userWinnerStake * distributableLosers) / winnerTotal);

        _sendValue(msg.sender, reward);

        emit RewardClaimed(matchId, msg.sender, reward);
    }

    function withdrawFees() external onlyOwner nonReentrant returns (uint256 amount) {
        amount = accruedProtocolFees;
        if (amount == 0) revert NothingToClaim();
        accruedProtocolFees = 0;

        _sendValue(feeRecipient, amount);

        emit FeesWithdrawn(feeRecipient, amount);
    }

    function previewClaim(uint256 matchId, address user) external view returns (uint256) {
        Pool memory pool = pools[matchId];
        if (!pool.resolved) return 0;

        StakeInfo memory userStake = stakes[matchId][user];
        if (userStake.claimed) return 0;

        uint256 userWinnerStake = pool.agentCorrect ? userStake.followAmount : userStake.fadeAmount;
        if (userWinnerStake == 0) return 0;

        uint256 winnerTotal = pool.agentCorrect ? pool.followTotal : pool.fadeTotal;
        uint256 loserTotal = pool.agentCorrect ? pool.fadeTotal : pool.followTotal;
        uint256 distributableLosers = loserTotal - pool.protocolFees;
        return userWinnerStake + ((userWinnerStake * distributableLosers) / winnerTotal);
    }

    function _toUint128(uint256 value) internal pure returns (uint128) {
        if (value > type(uint128).max) revert ValueTooLarge();
        return uint128(value);
    }

    function _sendValue(address recipient, uint256 amount) internal {
        (bool success, ) = payable(recipient).call{value: amount}("");
        if (!success) revert TransferFailed();
    }
}
