// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../../diamond/Diamond.sol";
import "../../contexts/access-control/internal/set-admin-role.sol";
import "../../contexts/access-control/internal/setup-role.sol";

import "./internal/roles.sol";

contract TellerProtocol_v1 is
    Diamond,
    int_setupRole_AccessControl_v1,
    int_setRoleAdmin_AccessControl_v1,
    Roles
{
    constructor(
        IDiamondCut.FacetCut[] memory diamondCut,
        Diamond.DiamondArgs memory args
    ) Diamond(diamondCut, args) {
        _initialize();
    }

    function _initialize() private {
        _setupRole(PAUSER, msg.sender);
        _setupRole(role, account);
    }
}

// contract TellerProtocol_v1 is Diamond {
//     // constructor() Diamond() {}
// }
