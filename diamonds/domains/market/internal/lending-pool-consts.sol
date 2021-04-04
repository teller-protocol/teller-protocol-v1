// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../../../libraries/AddressArrayLib.sol";

abstract contract sto_AssetRegistry_v1 {
    using AddressArrayLib for AddressArrayLib.AddressArray;

    struct AssetRegistryLayout {
        mapping(string => address) addresses;
    }

    bytes32 internal constant POS =
        keccak256("teller_protocol.storage.asset_registry.v1");

    function getAssetRegistry()
        internal
        pure
        returns (AssetRegistryLayout storage l_)
    {
        bytes32 position = POS;

        assembly {
            l_.slot := position
        }
    }
}
