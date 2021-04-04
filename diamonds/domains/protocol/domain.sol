// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../../diamond/Diamond.sol";
import "../../contexts/access-control/internal/set-role-admin.sol";
import "../../contexts/access-control/internal/setup-role.sol";

import "./internal/roles.sol";

contract TellerProtocol_v1 is Diamond {
    constructor(
        IDiamondCut.FacetCut[] memory diamondCut,
        Diamond.DiamondArgs memory args
    ) Diamond(diamondCut, args) {}
}
