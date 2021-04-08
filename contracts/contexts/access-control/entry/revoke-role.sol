// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Contracts
import "../data.sol";
import "../internal/revoke-role.sol";
import "../internal/is-admin-for-role.sol";

contract ent_revokeRole_AccessControl_v1 is
    int_revokeRole_AccessControl_v1,
    int_isAdminForRole_AccessControl_v1
{
    /**
     * @notice Removes a role from an address.
     *
     * Requirements:
     *  - Sender must be role admin.
     */
    function revokeRole(bytes32 role, address account) external {
        require(_isAdminForRole(role, msg.sender), "AccessControl: not admin");
        _revokeRole(role, account);
    }
}
