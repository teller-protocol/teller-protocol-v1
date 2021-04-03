// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./get-storage.sol";
import "../data.sol";

abstract contract int_revokeRole_AccessControl_v1 is int_get_sto_AccessControl_v1, dat_AccessControl_v1 {
    function _revokeRole(bytes32 role, address account) internal {
      getStorage().roles[role].members[account] = false;
      emit RoleRevoked(role, account, msg.sender);
    }
}

abstract contract int_revokeRole_AccessControl is int_revokeRole_AccessControl_v1 {}