// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Utils

// Interfaces

/**
    @notice It defines all the functions for the TToken registry

    @author develop@teller.finance
 */

interface IMarketRegistry {
    /**
        @notice It fetches an array of collateral tokens that a given lending token supports.
        @param lendingTokenAddress a token that the protocol lends.
        @return an array of collateral tokens supported by the lending token market.
     */
    function getMarkets(address lendingTokenAddress)
        external
        view
        returns (address[] memory);

    /**
        @notice It registers a new market with a LendingPool and Loans contract pair.
        @param lendingPoolAddress a lending pool contract used to borrow assets.
        @param loanManagerAddress a loan manager contract that stores all the relevant loans info and functionality.
     */
    function registerMarket(
        address lendingPoolAddress,
        address loanManagerAddress
    ) external;

    /**
        @notice It checks if a market already exists.
        @param lendingTokenAddress The lending token address.
        @param collateralTokenAddress The collateral token address.
     */
    function marketExists(
        address lendingTokenAddress,
        address collateralTokenAddress
    ) external view returns (bool);
}
