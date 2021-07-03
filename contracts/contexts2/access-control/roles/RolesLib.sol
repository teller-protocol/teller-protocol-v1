// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { AccessControlStorageLib, AccessControlStorage } from "../storage.sol";

library RolesLib {
    function s() private pure returns (AccessControlStorage storage) {
        return AccessControlStorageLib.store();
    }

    /**
     * @dev Provides information about the current execution context, including the
     * sender of the transaction. While these are generally available
     * via msg.sender, they should not be accessed in such a direct
     * manner, since when dealing with meta-transactions the account sending and
     * paying for execution may not be the actual sender (as far as an application
     * is concerned).
     */
    function _msgSender() internal view returns (address) {
        return msg.sender;
    }

    /**
     * @dev Emitted when `account` is granted `role`.
     */
    event RoleGranted(
        bytes32 indexed role,
        address indexed account,
        address indexed sender
    );

    /**
     * @dev Emitted when `account` is revoked `role`.
     */
    event RoleRevoked(
        bytes32 indexed role,
        address indexed account,
        address indexed sender
    );

    /**
     * @notice Checks if an account has a specific role.
     */
    function hasRole(bytes32 role, address account)
        internal
        view
        returns (bool)
    {
        return s().roles[role][account];
    }

    /**
     * @dev Gives an account a new role.
     * @dev Should only use when circumventing admin checking.
     * @dev If account already has the role, no event is emitted.
     * @param role Encoding of the role to give.
     * @param account Address to give the {role} to.
     */
    function grantRole(bytes32 role, address account) internal {
        if (hasRole(role, account)) return;
        s().roles[role][account] = true;
        emit RoleGranted(role, account, _msgSender());
    }

    /**
     * @dev Removes a role from an account.
     * @dev Should only use when circumventing admin checking.
     * @dev If account does not already have the role, no event is emitted.
     * @param role Encoding of the role to remove.
     * @param account Address to remove the {role} from.
     */
    function revokeRole(bytes32 role, address account) internal {
        if (!hasRole(role, account)) return;
        s().roles[role][account] = false;
        emit RoleRevoked(role, account, _msgSender());
    }
}
