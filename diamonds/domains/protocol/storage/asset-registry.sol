// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

abstract contract sto_AssetRegistry {
    struct AssetRegistryStorage {
        mapping(string => address) addresses;
        mapping(address => bool) ctokens;
    }

    function assetRegistryStore()
        internal
        pure
        returns (AssetRegistryStorage storage s)
    {
        bytes32 position = keccak256("teller_protocol.storage.asset_registry");

        assembly {
            s.slot := position
        }
    }
}
