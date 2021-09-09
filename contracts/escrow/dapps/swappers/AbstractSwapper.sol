// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Contracts
import { DappMods } from "../DappMods.sol";
import { PausableMods } from "../../../settings/pausable/PausableMods.sol";
import {
    ChainlinkPricer
} from "../../../price-aggregator/pricers/ChainlinkPricer.sol";

// Storage
import { AppStorageLib } from "../../../settings/storage/app.sol";

abstract contract AbstractSwapper is PausableMods, DappMods {
    function __isValidPath(address src, address dst) internal returns (bool) {
        ChainlinkPricer chainlinkPricer = AppStorageLib
            .store()
            .priceAggregator
            .chainlinkPricer();
        return
            address(chainlinkPricer.getEthAggregator(src)) != address(0) &&
            address(chainlinkPricer.getEthAggregator(dst)) != address(0);
    }
}
