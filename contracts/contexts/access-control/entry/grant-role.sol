// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Contracts
import "../data.sol";
import "../internal/grant-role.sol";
import "../internal/is-admin-for-role.sol";

contract ent_grantRole_AccessControl_v1 is
    int_grantRole_AccessControl_v1,
    int_isAdminForRole_AccessControl_v1
{
    /**
     * @notice Grants an address a new role.
     *
     * Requirements:
     *  - Sender must be role admin.
     */
    function grantRole(bytes32 role, address account) external {
        require(_isAdminForRole(role, msg.sender), "AccessControl: not admin");
        _grantRole(role, account);
    }
}
