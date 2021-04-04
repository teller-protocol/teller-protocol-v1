// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../../../libraries/AddressArrayLib.sol";

abstract contract sto_PriceAggregator {
    uint256 internal constant TEN = 10;

    struct PriceAggregatorStorage {
        mapping(address => mapping(address => address)) chainlinkAggregators;
        mapping(address => AddressArrayLib.AddressArray) supportedTokens;
    }

    function priceAggStore()
        internal
        pure
        returns (PriceAggregatorStorage storage s)
    {
        bytes32 position =
            keccak256("teller_protocol.storage.price_aggregator");

        assembly {
            s.slot := position
        }
    }
}
