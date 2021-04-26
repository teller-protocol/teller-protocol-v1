// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { RolesLib } from "./RolesLib.sol";
import { ADMIN } from "../../../shared/roles.sol";
import { Initializable } from "../../Initializable.sol";

abstract contract RolesContext is Initializable {
    /**
     * @notice Checks if an account has a specific role.
     * @param role Encoding of the role to check.
     * @param account Address to check the {role} for.
     */
    function _hasRole(bytes32 role, address account)
        internal
        view
        returns (bool)
    {
        return RolesLib.hasRole(role, account);
    }

    /**
     * @notice Grants an account a new role.
     * @param role Encoding of the role to give.
     * @param account Address to give the {role} to.
     *
     * Requirements:
     *  - Sender must be role admin.
     */
    function _grantRole(bytes32 role, address account) internal {
        require(RolesLib.hasRole(ADMIN, account), "AccessControl: not admin");
        RolesLib.grantRole(role, account);
    }

    /**
     * @notice Removes a role from an account.
     * @param role Encoding of the role to remove.
     * @param account Address to remove the {role} from.
     *
     * Requirements:
     *  - Sender must be role admin.
     */
    function _revokeRole(bytes32 role, address account) internal {
        require(RolesLib.hasRole(ADMIN, account), "AccessControl: not admin");
        RolesLib.revokeRole(role, account);
    }

    /**
     * @notice Removes a role from the sender.
     * @param role Encoding of the role to remove.
     */
    function _renounceRole(bytes32 role) internal {
        RolesLib.revokeRole(role, msg.sender);
    }

    function __INIT_RolesContext(address admin) internal initializer {
        RolesLib.grantRole(ADMIN, admin);
    }
}
