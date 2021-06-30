// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface ITTokenStrategy {
    event StrategyRebalanced(
        string indexed strategyName,
        address indexed sender
    );

    /**
     * @notice it returns the total supply of an underlying asset in a Teller token.
     * @return uint256 the underlying supply
     */
    function totalUnderlyingSupply() external returns (uint256);

    /**
     * @notice it rebalances the underlying asset held by the Teller Token.
     *
     */
    function rebalance() external;

    /**
     * @notice it withdraws amount of tokens in a pool
     * @param amount amount to withdraw
     */

    function withdraw(uint256 amount) external;
}
