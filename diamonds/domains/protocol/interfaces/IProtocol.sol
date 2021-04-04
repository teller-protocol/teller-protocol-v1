// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./IDappRegistry.sol";
import "./IPriceAggregator.sol";
import "./IPlatformSettings.sol";
import "./IAssetSettings.sol";
import "./IAssetRegistry.sol";
import "./IMarketFactory.sol";
import "./IMarketRegistry.sol";

interface IProtocol is
    IDappRegistry,
    IPriceAggregator,
    IPlatformSettings,
    IAssetSettings,
    IAssetRegistry,
    IMarketFactory,
    IMarketRegistry
{}
