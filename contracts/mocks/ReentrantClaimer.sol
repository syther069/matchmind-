// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {StakingPool} from "../StakingPool.sol";

contract ReentrantClaimer {
    StakingPool public immutable pool;
    uint256 public targetMatchId;
    bool public attackEnabled;

    constructor(address poolAddress) {
        pool = StakingPool(poolAddress);
    }

    function stake(uint256 matchId) external payable {
        pool.stake{value: msg.value}(matchId, StakingPool.Side.Follow);
    }

    function attack(uint256 matchId) external {
        targetMatchId = matchId;
        attackEnabled = true;
        pool.claim(matchId);
    }

    receive() external payable {
        if (attackEnabled) {
            attackEnabled = false;
            pool.claim(targetMatchId);
        }
    }
}
