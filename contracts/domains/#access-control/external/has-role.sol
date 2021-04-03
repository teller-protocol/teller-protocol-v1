// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { Roles } from "../../../enums/Roles.sol";

/**
  THIS?
 */
contract AccessControl_HasRoleFacet {

}

/**
    OR THAT?
 */
abstract contract abs_AccessControl is HasRoleFacet {

}

interface i_AccessControl {
    function hasRole(
        Roles role,
        address account,
        address domain
    ) external view;
}
