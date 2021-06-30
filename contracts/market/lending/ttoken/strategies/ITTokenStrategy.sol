// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface ITTokenStrategy {
    /**
     * @notice This event is emitted when the underlying assets are rebalanced as directed by the set investment strategy.
     * @param strategyName The name of the strategy being rebalanced - example: "CompoundStrategy_1"
     * @param sender The address of the sender rebalancing the token strategy.
     */
    event StrategyRebalanced(
        string indexed strategyName,
        address indexed sender
    );

    /**
     * @notice This event is emitted when the underlying assets are rebalanced as directed by the set investment strategy.
     * @param strategyName The name of the strategy being rebalanced - example: "CompoundStrategy_1"
     * @param investmentAsset The address of the investible asset / protocol being used to leverage the underlying assets.
     * @param sender The address of the sender rebalancing the token strategy.
     */
    event StrategyInitialized(
        string indexed strategyName,
        address investmentAsset,
        address indexed sender
    );

    /**
     * @notice it returns the total supply of an underlying asset in a Teller token.
     * @return uint256 the underlying supply
     */
    function totalUnderlyingSupply() external returns (uint256);

    /**
     * @notice it rebalances the underlying asset held by the Teller Token.
     */
    function rebalance() external;

    /**
     * @notice it withdraws amount of tokens in a pool
     * @param amount amount to withdraw
     */

    function withdraw(uint256 amount) external;
}
