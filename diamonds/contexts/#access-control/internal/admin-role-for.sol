// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import { int_get_sto_AccessControl_v1 } from "./get-storage.sol";

abstract contract int_adminRoleFor_AccessControl_v1 is int_get_sto_AccessControl_v1 {
    function _adminRoleFor(
        bytes32 role
    ) internal view returns (bytes32 adminRoleFor_) {
      adminRoleFor_ = getStorage().roles[role].adminRole;
    }
}

abstract contract int_adminRoleFor_AccessControl is int_adminRoleFor_AccessControl_v1 {}