// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { AccessControlStorageLib, AccessControlStorage } from "../storage.sol";

library OwnerLib {
    function s() private pure returns (AccessControlStorage storage) {
        return AccessControlStorageLib.store();
    }

    /**
     * @dev Emitted when {owner} is set for {account}.
     */
    event OwnerSet(address indexed account, address indexed owner);

    /**
     * @dev Emitted when new {owner} is given ownership of {account}.
     */
    event OwnerTransferred(
        address indexed account,
        address indexed owner,
        address indexed prevOwner
    );

    /**
     * @notice Gets the owner for an address.
     * @param account Address to check ownership of.
     */
    function ownerOf(address account) internal view returns (address) {
        return AccessControlStorageLib.store().owners[account];
    }

    /**
     * @notice Sets an owner for an address.
     * @dev Should only use when circumventing admin checking.
     * @param account Address to set ownership of.
     * @param owner Address to set ownership of {account} to.
     */
    function setOwner(address account, address owner) internal {
        s().owners[account] = owner;
        emit OwnerSet(account, owner);
    }

    /**
     * @notice Transfers ownership of an address.
     * @dev Should only use when circumventing admin checking.
     * @param account Address to transfer ownership of.
     * @param newOwner Address to transfer ownership of {account} to.
     */
    function transferOwner(address account, address newOwner) internal {
        s().owners[account] = newOwner;
        emit OwnerTransferred(account, newOwner, msg.sender);
    }
}
