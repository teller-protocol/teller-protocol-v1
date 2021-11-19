// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Contracts
import { RolesMods } from "../contexts2/access-control/roles/RolesMods.sol";
import { ADMIN, PAUSER } from "../shared/roles.sol";
import {
    UpgradeableBeaconFactory
} from "../shared/proxy/beacon/UpgradeableBeaconFactory.sol";
import { PriceAggregator } from "../price-aggregator/PriceAggregator.sol";

// Interfaces
import { IUniswapV2Router } from "../shared/interfaces/IUniswapV2Router.sol";

// Libraries
import { RolesLib } from "../contexts2/access-control/roles/RolesLib.sol";
import { NFTLib } from "../nft/libraries/NFTLib.sol";

// Storage
import { AppStorageLib, AppStorage } from "../storage/app.sol";

struct InitArgs {
    address admin;
    address loansEscrowBeacon;
    address collateralEscrowBeacon;
    address tTokenBeacon;
    address nftLiquidationController;
    address wrappedNativeToken;
    address priceAggregator;
}

contract SettingsFacet is RolesMods {
    /**
     * @notice Sets a new address to which NFTs should be sent when used for taking out a loan and gets liquidated.
     * @param newController The address where NFTs should be transferred.
     */
    function setNFTLiquidationController(address newController)
        external
        authorized(ADMIN, msg.sender)
    {
        AppStorageLib.store().nftLiquidationController = newController;
    }

    /**
     * @notice Gets the new address where NFTs are sent when used for taking out a loan and gets liquidated.
     * @return controller_ The address where NFTs are be transferred.
     */
    function getNFTLiquidationController()
        external
        view
        returns (address controller_)
    {
        controller_ = AppStorageLib.store().nftLiquidationController;
    }

    /**
     * @notice it stores multiple parameters in the AppStorageLib
     * @param _args multiple arguments that are stored in the AppStorageLibrary
     */
    function init(InitArgs calldata _args) external {
        AppStorage storage s = AppStorageLib.store();

        if (s.initialized) return;
        s.initialized = true;

        RolesLib.grantRole(ADMIN, _args.admin);
        RolesLib.grantRole(PAUSER, _args.admin);

        s.loansEscrowBeacon = UpgradeableBeaconFactory(_args.loansEscrowBeacon);
        s.collateralEscrowBeacon = UpgradeableBeaconFactory(
            _args.collateralEscrowBeacon
        );
        s.tTokenBeacon = UpgradeableBeaconFactory(_args.tTokenBeacon);
        s.nftLiquidationController = _args.nftLiquidationController;
        s.wrappedNativeToken = _args.wrappedNativeToken;
        s.priceAggregator = PriceAggregator(_args.priceAggregator);
    }

    function init2(address wrappedNativeTokenAddress, address priceAggAddress)
        external
        authorized(ADMIN, msg.sender)
    {
        require(
            AppStorageLib.store().wrappedNativeToken == address(0) ||
                address(AppStorageLib.store().priceAggregator) == address(0),
            "Teller: already init2"
        );

        AppStorageLib.store().wrappedNativeToken = wrappedNativeTokenAddress;
        AppStorageLib.store().priceAggregator = PriceAggregator(
            priceAggAddress
        );
    }
}
