// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../interfaces/IAssetRegistry.sol";
import "../storage/asset-registry.sol";

abstract contract ext_AssetRegistry_v1 is IAssetRegistry, sto_AssetRegistry {
    function getAsset(string memory asset) external view returns (address) {
        return getAssetRegistry().addresses[asset];
    }

    function assetInfo(address asset) external view returns (bool isCToken) {
        isCToken = assetRegistryStorage().ctokens;
    }
}
