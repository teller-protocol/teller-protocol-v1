// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import {
    Diamond,
    IDiamondCut,
    IDiamondLoupe,
    IERC173
} from "../diamond/Diamond.sol";
import { OwnershipFacet } from "../diamond/facets/OwnershipFacet.sol";
import { Domains } from "../../enums/Domains.sol";

/**
  Protocol, LendingPool, etc. all inherit from this.
 */
abstract contract BaseDomain is Diamond {
    Domains public immutable DOMAIN;

    address public constant DIAMOND_CUT_FACET = address(0x0);
    bytes4[] internal DIAMOND_CUT_SELECTORS = [IDiamondCut.diamondCut.selector];

    address public constant DIAMOND_LOUPE_FACET = address(0x0);
    bytes4[] internal DIAMOND_LOUPE_SELECTORS = [
        IDiamondLoupe.facets.selector,
        IDiamondLoupe.facetFunctionSelectors.selector,
        IDiamondLoupe.facetAddresses.selector,
        IDiamondLoupe.facetAddress.selector
    ];

    address public constant OWNERSHIP_FACET = address(0x0);
    bytes4[] internal OWNERSHIP_SELECTORS = [
        OwnershipFacet.transferOwnership.selector,
        OwnershipFacet.owner.selector
    ];

    IDiamondCut.FacetCut[] public initialFacetCuts = [
        IDiamondCut.FacetCut(
            DIAMOND_CUT_FACET,
            IDiamondCut.FacetCutAction.Add,
            DIAMOND_CUT_SELECTORS
        ),
        IDiamondCut.FacetCut(
            DIAMOND_LOUPE_FACET,
            IDiamondCut.FacetCutAction.Add,
            DIAMOND_LOUPE_SELECTORS
        ),
        IDiamondCut.FacetCut(
            OWNERSHIP_FACET,
            IDiamondCut.FacetCutAction.Add,
            OWNERSHIP_SELECTORS
        )
    ];

    constructor(address owner, Domains domain)
        Diamond(initialFacetCuts, Diamond.DiamondArgs(owner))
    {
        DOMAIN = domain;
    }
}
