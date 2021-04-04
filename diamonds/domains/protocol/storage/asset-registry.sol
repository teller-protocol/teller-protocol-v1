// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

struct AssetRegistryLayout {
    mapping(string => address) addresses;
}

function getAssetRegistry() pure returns (AssetRegistryLayout storage l_) {
    bytes32 position = keccak256("teller_protocol.storage.asset_settings.v1");

    assembly {
        l_.slot := position
    }
}
