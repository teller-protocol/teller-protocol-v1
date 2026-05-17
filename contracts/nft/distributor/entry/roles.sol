// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { LibDiamond } from "../../../shared/libraries/LibDiamond.sol";
import { AccessControlEvents } from "../../../contexts/access-control/data.sol";
import "../../../contexts/access-control/storage/roles.sol";

contract ent_roles_NFTDistributor_v1 is sto_AccessControl_Roles {
    /**
     * @notice Checks if an account has a specific role.
     * @param role Encoding of the role to check.
     * @param account Address to check the {role} for.
     */
    function hasRole(bytes32 role, address account)
        external
        view
        returns (bool)
    {
        return accessControlRolesStore().roles[role].members[account];
    }

    /**
     * @notice Grants an account a new role.
     * @param role Encoding of the role to give.
     * @param account Address to give the {role} to.
     *
     * Requirements:
     *  - Sender must be diamond owner.
     */
    function grantRole(bytes32 role, address account) external {
        LibDiamond.enforceIsContractOwner();
        _grantRole(role, account);
    }

    /**
     * @notice Removes a role from an account.
     * @param role Encoding of the role to remove.
     * @param account Address to remove the {role} from.
     *
     * Requirements:
     *  - Sender must be diamond owner.
     */
    function revokeRole(bytes32 role, address account) external {
        LibDiamond.enforceIsContractOwner();
        _revokeRole(role, account);
    }

    /**
     * @notice Removes a role from the sender.
     * @param role Encoding of the role to remove.
     */
    function renounceRole(bytes32 role) external {
        _revokeRole(role, msg.sender);
    }

    function _grantRole(bytes32 role, address account) internal {
        if (accessControlRolesStore().roles[role].members[account]) return;
        accessControlRolesStore().roles[role].members[account] = true;
        emit AccessControlEvents.RoleGranted(role, account, msg.sender);
    }

    function _revokeRole(bytes32 role, address account) internal {
        if (!accessControlRolesStore().roles[role].members[account]) return;
        accessControlRolesStore().roles[role].members[account] = false;
        emit AccessControlEvents.RoleRevoked(role, account, msg.sender);
    }
}
