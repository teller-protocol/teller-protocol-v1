// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface ITTokenStrategy {
    event StrategyRebalanced(
        string indexed strategyName,
        address indexed sender
    );

    function totalUnderlyingSupply() external returns (uint256);

    function rebalance() external;

    function withdraw(uint256 amount) external;
}
