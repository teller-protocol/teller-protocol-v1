// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Contracts
import {
    ReentryMods
} from "../contexts2/access-control/reentry/ReentryMods.sol";
import { RolesMods } from "../contexts2/access-control/roles/RolesMods.sol";
import { ADMIN } from "../shared/roles.sol";

// Interfaces
import { ITToken_V3 } from "./ttoken/ITToken_V3.sol";

// Libraries
import { LendingLib } from "./libraries/LendingLib.sol";

// Storage
import { AppStorageLib } from "../storage/app.sol";

contract LendingFacet is RolesMods, ReentryMods {
    /**
     * @notice This event is emitted when a new lending pool is initialized.
     * @param sender address.
     * @param asset Token address the pool was initialized for.
     */
    event LendingPoolInitialized(address indexed sender, address asset);

    /**
     * @notice Get the Teller Token address for an underlying asset.
     * @param asset Address to get a Teller Token for.
     */
    function getTTokenFor(address asset)
        external
        view
        returns (address tToken_)
    {
        tToken_ = address(LendingLib.tToken(asset));
    }

    /**
     * @notice It initializes a new lending pool for the respective token
     * @param asset Token address to initialize the lending pool for.
     */
    function initLendingPool(address asset)
        external
        authorized(ADMIN, msg.sender)
    {
        require(
            address(LendingLib.tToken(asset)) == address(0),
            "Teller: lending pool already initialized"
        );

        // Create a new Teller Token
        address tToken = AppStorageLib.store().tTokenBeacon.cloneProxy("");
        // Set the Teller Token to the asset mapping
        LendingLib.s().tTokens[asset] = ITToken_V3(tToken);
        // Initialize the Teller Token
        LendingLib.s().tTokens[asset].initialize(
            msg.sender,
            asset,
            AppStorageLib.store().wrappedNativeToken == asset
        );

        // Emit event
        emit LendingPoolInitialized(msg.sender, asset);
    }
}
