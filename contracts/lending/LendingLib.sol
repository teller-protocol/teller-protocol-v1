// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Interfaces
import { ITToken } from "./ttoken/ITToken.sol";

// Storage
import { MarketStorageLib, MarketStorage } from "../storage/market.sol";

library LendingLib {
    function s(address asset) internal returns (MarketStorage storage) {
        return MarketStorageLib.store();
    }

    function tToken(address asset) internal view returns (ITToken tToken_) {
        tToken_ = s().tTokens[asset];
    }
}
