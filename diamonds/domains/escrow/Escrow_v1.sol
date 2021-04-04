// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Contracts
import "../../diamond/Diamond.sol";

// Interfaces
import "./interfaces/IEscrow.sol";

contract Escrow_v1 is Diamond {
    constructor(
        IDiamondCut.FacetCut[] memory _diamondCut,
        DiamondArgs memory _args
    ) Diamond(_diamondCut, _args) {
        // Add interface for TellerNFT
        ds.supportedInterfaces[type(IEscrow).interfaceId] = true;
    }
}
