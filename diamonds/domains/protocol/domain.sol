// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../../diamond/Diamond.sol";

contract TellerProtocol_v1 is Diamond {
    constructor(
        IDiamondCut.FacetCut[] memory diamondCut,
        Diamond.DiamondArgs memory args
    ) Diamond(diamondCut, args) {}
}
