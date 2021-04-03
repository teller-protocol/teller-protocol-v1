// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../diamond/Diamond.sol";
import "../diamond/facets/OwnershipFacet.sol";
import "../diamond/facets/DiamondCutFacet.sol";
import "../diamond/facets/DiamondLoupeFacet.sol";

import "../storage/Main.sol";

contract TellerProtocol_v1 is
    Diamond,
    OwnershipFacet,
    DiamondCutFacet,
    DiamondLoupeFacet
{
    constructor(
        IDiamondCut.FacetCut[] memory _diamondCut,
        DiamondArgs memory _args
    ) payable Diamond(_diamondCut, _args) {}

    receive() external payable override {}

    /**
        External function with state read.
     */
    function whitelisted() external view returns (bool whitelisted_) {
        whitelisted_ = MainStorage.get().whitelisted[msg.sender];
    }
}
