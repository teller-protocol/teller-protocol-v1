// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Contracts
import "../../diamond/Diamond.sol";

// Interfaces
import "./interfaces/ITellerNFT.sol";

import "diamonds/Constants.sol";

contract TellerNFT_v1 is Diamond {
    constructor(
        IDiamondCut.FacetCut[] memory _diamondCut,
        DiamondArgs memory _args
    ) Diamond(_diamondCut, _args) {
        LibDiamond.DiamondStorage storage ds = LibDiamond.diamondStorage();
        // Add interface for TellerNFT
        ds.supportedInterfaces[type(ITellerNFT).interfaceId] = true;
    }
}
