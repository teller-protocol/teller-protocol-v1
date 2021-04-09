// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Contracts
import "../nft/TellerNFT.sol";

// Interfaces
import { IUniswapV2Router } from "../shared/interfaces/IUniswapV2Router.sol";

// Libraries
import { PlatformSettingsLib } from "../settings/PlatformSettingsLib.sol";
import { CacheLib } from "../shared/libraries/CacheLib.sol";

struct AppStorage {
    bool initialized;
    bool platformRestricted;
    mapping(bytes32 => PlatformSettingsLib.PlatformSetting) platformSettings;
    mapping(address => CacheLib.Cache) assetSettings;
    mapping(string => address) assetAddresses;
    mapping(address => bool) ctokenRegistry;
    IUniswapV2Router uniswapRouter;
    TellerNFT nft;
}

library AppStorageLib {
    function store() internal pure returns (AppStorage storage s) {
        assembly {
            s.slot := 0
        }
    }
}
