// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { RolesLib } from "./RolesLib.sol";

abstract contract RolesMods {
    /**
     * @notice Requires that the {account} has {role}
     * @param role Encoding of the role to check.
     * @param account Address to check the {role} for.
     */
    modifier authorized(bytes32 role, address account) {
        require(
            RolesLib.hasRole(role, account),
            "AccessControl: not authorized"
        );
        _;
    }

    /**
     * @dev Provides information about the current execution context, including the
     * sender of the transaction. While these are generally available
     * via msg.sender, they should not be accessed in such a direct
     * manner, since when dealing with meta-transactions the account sending and
     * paying for execution may not be the actual sender (as far as an application
     * is concerned).
     */
    function msgSender() internal returns (address) {
        return RolesLib._msgSender();
    }
}
