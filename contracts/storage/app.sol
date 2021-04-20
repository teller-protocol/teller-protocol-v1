// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Contracts
import { TellerNFT } from "../nft/TellerNFT.sol";

// Interfaces
import { IUniswapV2Router } from "../shared/interfaces/IUniswapV2Router.sol";
import { IPriceAggregator } from "../shared/interfaces/IPriceAggregator.sol";

// Libraries
import { PlatformSetting } from "../settings/platform/PlatformSettingsLib.sol";
import { Cache } from "../shared/libraries/CacheLib.sol";
import {
    UpgradeableBeaconFactory
} from "../shared/proxy/beacon/UpgradeableBeaconFactory.sol";

struct AppStorage {
    bool initialized;
    bool platformRestricted;
    mapping(bytes32 => PlatformSetting) platformSettings;
    mapping(address => Cache) assetSettings;
    mapping(string => address) assetAddresses;
    mapping(address => bool) cTokenRegistry;
    IUniswapV2Router uniswapRouter;
    TellerNFT nft;
    IPriceAggregator priceAggregator;
    UpgradeableBeaconFactory loansEscrowBeacon;
    UpgradeableBeaconFactory collateralEscrowBeacon;
}

library AppStorageLib {
    function store() internal pure returns (AppStorage storage s) {
        assembly {
            s.slot := 0
        }
    }
}
