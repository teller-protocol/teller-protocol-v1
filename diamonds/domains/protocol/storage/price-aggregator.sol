// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../../../libraries/AddressArrayLib.sol";

abstract contract sto_PriceAggregator {
    uint256 internal constant TEN = 10;

    struct PriceAggregatorStorage {
        mapping(address => mapping(address => address)) chainlinkAggregators;
        mapping(address => AddressArrayLib.AddressArray) supportedTokens;
    }

    bytes32 internal constant POSITION =
        keccak256("teller_protocol.storage.price_aggregator");

    function priceAggStore()
        internal
        pure
        returns (PriceAggregatorStorage storage s)
    {
        bytes32 position = POSITION;

        assembly {
            s.slot := position
        }
    }
}
