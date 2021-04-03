// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../storage/market-registry.sol";
import "../internal/market-registry.sol";

abstract contract ext_MarketRegistry_v1 is
    sto_MarketRegistry_v1,
    int_MarketRegistry_v1
{
    using AddressArrayLib for AddressArrayLib.AddressArray;

    /**
        @notice It fetches an array of collateral tokens that a given lending token supports.
        @param lendingTokenAddress a token that the protocol lends.
        @return an array of collateral tokens supported by the lending token market.
     */
    function getMarkets(address lendingTokenAddress)
        external
        view
        returns (address[] memory)
    {
        return getMarketRegistryStorage().markets[lendingTokenAddress].array;
    }

    /**
        @notice It maps a lending token to the associated LendingPool contract.
        @param lendingTokenAddress the lending token used in a LendingPool.
        @return the LendingPool contract for the given token.
     */
    function lendingPools(address lendingTokenAddress)
        external
        view
        returns (address)
    {
        return getMarketRegistryStorage().lendingPools[lendingTokenAddress];
    }

    /**
        @notice It maps a lending token and collateral token to the associated LoanManager contract.
        @param lendingTokenAddress a token the protocol lends out.
        @param collateralTokenAddress a token that is used as collateral.
        @return the Loans contract for the given token pair.
     */
    function loanManagers(
        address lendingTokenAddress,
        address collateralTokenAddress
    ) external view returns (address) {
        return
            getMarketRegistryStorage().loanManagers[lendingTokenAddress][
                collateralTokenAddress
            ];
    }

    /**
        @notice It represents a mapping to identify a LendingPool's LoanManager contract address.
        @param lendingPoolAddress a LendingPool contract.
        @param loanManagerAddress a Loans contract.
        @return true if the Loans contract address is registered to the LendingPool contract.
     */
    function loanManagerRegistry(
        address lendingPoolAddress,
        address loanManagerAddress
    ) external view returns (bool) {
        return
            getMarketRegistryStorage().loanManagerRegistry[lendingPoolAddress][
                loanManagerAddress
            ];
    }

    /**
        @notice It checks if a market already exists.
        @param lendingTokenAddress The lending token address.
        @param collateralTokenAddress The collateral token address.
     */
    function marketExists(
        address lendingTokenAddress,
        address collateralTokenAddress
    ) external view virtual returns (bool exists) {
        return _marketExists(lendingTokenAddress, collateralTokenAddress);
    }
}
