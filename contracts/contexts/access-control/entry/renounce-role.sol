// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Contracts
import "../data.sol";
import "../internal/revoke-role.sol";
import "../internal/is-admin-for-role.sol";

contract ent_renounceRole_AccessControl_v1 is
    int_revokeRole_AccessControl_v1,
    int_isAdminForRole_AccessControl_v1
{
    /**
     * @notice Grants an address a new role.
     * @param role the role to revoke for the account
     * @param account the address of the respective account to revoke
     * Requirements:
     *  - Sender must be role admin.
     */
    function renounceRole(bytes32 role, address account) external {
        require(
            account == msg.sender,
            "AccessControl: can only renounce roles for self"
        );
        _revokeRole(role, account);
    }
}
