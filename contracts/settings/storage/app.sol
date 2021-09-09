// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Contracts
import { TellerNFT } from "../../nft/TellerNFT.sol";
import { PriceAggregator } from "../../price-aggregator/PriceAggregator.sol";

// Libraries
import {
    PlatformSetting
} from "../../settings/platform/libraries/PlatformSettingsLib.sol";
import { Cache } from "../../shared/libraries/CacheLib.sol";
import {
    UpgradeableBeaconFactory
} from "../../shared/proxy/beacon/UpgradeableBeaconFactory.sol";

/**
 * if a variable begins with an _, that means it is deprecated
 */
struct AppStorage {
    // is it initialized
    bool initialized;
    // is it platform restricted
    bool platformRestricted;
    // mapping between contract IDs and if they're paused
    mapping(bytes32 => bool) paused;
    // platform settings storage
    mapping(bytes32 => PlatformSetting) platformSettings;
    // asset settings storage
    mapping(address => Cache) assetSettings;
    // all of our asset addresses (deprecated)
    mapping(string => address) _assetAddresses; // DEPRECATED
    // the _cTokenRegistry (deprecated)
    mapping(address => bool) _cTokenRegistry; // DEPRECATED
    // Our TellerNFT contract
    TellerNFT nft; // can deprecate due to us already setting the address as immutable in our facets
    // Loan escrow beacon
    UpgradeableBeaconFactory loansEscrowBeacon;
    // Collateral escrow beacon
    UpgradeableBeaconFactory collateralEscrowBeacon;
    // nft liquidation controller
    address nftLiquidationController;
    // ttoken beacon
    UpgradeableBeaconFactory tTokenBeacon;
    // wrapped native token
    address wrappedNativeToken;
    // price aggregator
    PriceAggregator priceAggregator;
}

library AppStorageLib {
    function store() internal pure returns (AppStorage storage s) {
        assembly {
            s.slot := 0
        }
    }
}
