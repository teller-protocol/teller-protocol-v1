// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Libraries
import { AddressArrayLib } from "../shared/libraries/AddressArrayLib.sol";

struct PriceAggStorage {
    mapping(address => mapping(address => address)) chainlinkAggregators;
}

bytes32 constant PRICE_AGG_STORAGE_POS = keccak256(
    "teller.price.aggregator.storage"
);

library PriceAggStorageLib {
    function store() internal pure returns (PriceAggStorage storage s) {
        bytes32 pos = PRICE_AGG_STORAGE_POS;
        assembly {
            s.slot := pos
        }
    }
}
