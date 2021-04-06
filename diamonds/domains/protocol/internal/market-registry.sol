// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "../storage/market-registry.sol";
import "../../../libraries/AddressArrayLib.sol";

abstract contract int_MarketRegistry_v1 is sto_MarketRegistry {
    using AddressArrayLib for AddressArrayLib.AddressArray;

    function _marketExists(
        address lendingTokenAddress,
        address collateralTokenAddress
    ) internal view returns (bool exists) {
        (exists, ) = getMarketRegistryStorage().markets[lendingTokenAddress]
            .getIndex(collateralTokenAddress);
    }
}
