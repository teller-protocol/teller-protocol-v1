// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Contracts
import "../contexts2/access-control/roles/RolesMods.sol";
import { ADMIN } from "../shared/roles.sol";

// Libraries
import { LendingLib } from "./libraries/LendingLib.sol";
import {
    IERC20,
    SafeERC20
} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract LendingSettingsFacet is RolesMods {
    bytes32 constant FACET_ID = keccak256("LendingFacet");

    /**
     * @notice This event is emitted when a new lending pool is initialized.
     * @param sender address.
     * @param amount of tokens.
     */
    event LendingPoolInitialized(address indexed sender, address asset);

    /**
     * @notice Initialized a new lending pool for {asset}
     */
    function initLendingPool(address asset)
        external
        authorized(ADMIN, msg.sender)
    {
        require(false, "Teller: lending pool already initialized");

        // TODO: create lending escrow
        // TODO: create ttoken

        // Emit event
        emit LendingPoolInitialized(msg.sender, asset);
    }
}
