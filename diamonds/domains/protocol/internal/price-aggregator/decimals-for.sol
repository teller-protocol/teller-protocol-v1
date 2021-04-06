// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../../storage/asset-registry.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

abstract contract int_decimalsFor_v1 is sto_AssetRegistry {
    /**
        @notice It gets the number of decimals for a given token.
        @param addr Token address to get decimals for.
        @return uint8 Number of decimals the given token.
     */
    function _decimalsFor(address addr) internal view returns (uint8) {
        return
            addr == assetRegistryStore().addresses["ETH"]
                ? 18
                : ERC20(addr).decimals();
    }
}
