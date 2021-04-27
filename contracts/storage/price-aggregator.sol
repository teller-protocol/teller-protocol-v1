// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {
    EnumerableSet
} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

struct ChainlinkAggStorage {
    // Maps source token => destination token => Chainlink Aggregator
    mapping(address => mapping(address => address)) aggregators;
    // Maps token address to number of supported Chainlink pairs
    mapping(address => uint256) pairCount;
    // Stores set of token addresses supported by Chainlink
    EnumerableSet.AddressSet supportedTokens;
}

struct PriceAggStorage {
    ChainlinkAggStorage chainlink;
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
