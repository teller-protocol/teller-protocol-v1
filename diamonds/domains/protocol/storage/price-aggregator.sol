// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../../../libraries/AddressArrayLib.sol";

abstract contract sto_PriceAggregator_v1 {
    uint256 internal constant TEN = 10;

    struct PriceAggregatorLayout {
        mapping(address => mapping(address => address)) aggregators;
        mapping(address => AddressArrayLib.AddressArray) supportedTokens;
    }

    bytes32 internal constant POSITION =
        keccak256("teller_protocol.storage.price_aggregator.v1");

    function getPriceAggregator()
        internal
        pure
        returns (PriceAggregatorLayout storage l_)
    {
        bytes32 position = POSITION;

        assembly {
            l_.slot := position
        }
    }
}
