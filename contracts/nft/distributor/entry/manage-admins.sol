// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Contracts
import "../../../contexts/access-control/modifiers/only-owner.sol";

// Utils
import { ADMIN } from "../data.sol";
import { AccessControlEvents, RoleData } from "../../../contexts/access-control/data.sol";

contract ent_manageAdmins_NFTDistributor_v1 is
    mod_onlyOwner_AccessControl_v1
{
    bytes32 private constant ROLES_POS =
        keccak256("teller_protocol.storage.access_control.roles");

    struct AccessControlRolesStorage {
        mapping(bytes32 => RoleData) roles;
    }

    function _rolesStore()
        private
        pure
        returns (AccessControlRolesStorage storage s)
    {
        bytes32 position = ROLES_POS;
        assembly {
            s.slot := position
        }
    }

    /**
     * @notice Grants ADMIN role to an account.
     * @param account The address to grant ADMIN.
     */
    function grantAdmin(address account) external onlyOwner {
        if (_rolesStore().roles[ADMIN].members[account]) return;
        _rolesStore().roles[ADMIN].members[account] = true;
        emit AccessControlEvents.RoleGranted(ADMIN, account, msg.sender);
    }

    /**
     * @notice Revokes ADMIN role from an account.
     * @param account The address to revoke ADMIN from.
     */
    function revokeAdmin(address account) external onlyOwner {
        if (!_rolesStore().roles[ADMIN].members[account]) return;
        _rolesStore().roles[ADMIN].members[account] = false;
        emit AccessControlEvents.RoleRevoked(ADMIN, account, msg.sender);
    }
}
