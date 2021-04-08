// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { AccessControlStorageLib } from "../storage.sol";
import { OwnerLib } from "./OwnerLib.sol";
import { RolesMods } from "../roles/RolesMods.sol";
import { ADMIN } from "../../../shared/roles.sol";

contract OwnerFacet is RolesMods {
    /**
     * @notice Sets an owner for an address.
     * @param account Address to set ownership of.
     * @param owner Address to set ownership of {account} to.
     *
     * Requirements:
     *  - Sender must be role admin.
     */
    function setOwner(address account, address owner)
        external
        authorized(ADMIN, msg.sender)
    {
        require(
            OwnerLib.ownerOf(account) == address(0),
            "AccessControl: owner already set"
        );
        OwnerLib.setOwner(account, owner);
    }

    /**
     * @notice Transfers ownership of an address.
     * @param account Address to transfer ownership of.
     * @param owner Address to transfer ownership of {account} to.
     *
     * Requirements:
     *  - Sender must be role admin.
     */
    function transferOwner(address account, address owner)
        external
        authorized(ADMIN, msg.sender)
    {
        require(
            OwnerLib.ownerOf(account) == msg.sender,
            "AccessControl: not owner"
        );
        OwnerLib.transferOwner(account, owner);
    }
}
