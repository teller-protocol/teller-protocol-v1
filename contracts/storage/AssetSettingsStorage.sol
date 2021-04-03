// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
pragma experimental ABIEncoderV2;

library AssetSettingsStorage {
    struct AssetSettingsStorage {
        mapping(address => CacheLib.Cache) assets;
    }

    struct Cache {
        // Mapping of cache keys names to address values.
        mapping(bytes32 => address) addresses;
        // Mapping of cache keys names to uint256 values.
        mapping(bytes32 => uint256) uints;
        // Mapping of cache keys names to int256 values.
        mapping(bytes32 => int256) ints;
        // Mapping of cache keys names to bytes32 values.
        mapping(bytes32 => bytes32) bites;
        // Mapping of cache keys names to bool values.
        mapping(bytes32 => bool) bools;
    }

    function assetSettingsStorage()
        internal
        pure
        returns (AssetSettingsStorage storage a_)
    {
        bytes32 storagePosition =
            keccak256("teller_protocol.storage.assetSettingsStorage");

        assembly {
            as_.slot := storagePosition
        }
    }
}
