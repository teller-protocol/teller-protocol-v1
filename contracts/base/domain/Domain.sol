// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { Diamond } from "../diamond/Diamond.sol";
import { Roles } from "../../enums/Roles.sol";
import { s_Domain } from "../../storage/Domain.sol";

contract Domain is BaseDomain {
    address public immutable PROTOCOL;

    constructor(address protocol) BaseDomain(msg.sender) {
        PROTOCOL = protocol;
        diamondCut
    }
}

/**
  Protocol, LendingPool, etc. all inherit from this base set of functions
 */
abstract contract BaseDomain is Diamond {
    address public constant OWNERSHIP_FACET = 0x0;
    address public constant DIAMONDLOUPE_FACET = 0x0;
    address public constant DIAMONDCUT_FACET = 0x0;

    constructor(address owner)
        Diamond(
            [IDiamondCut.FacetCut(
                OWNERSHIP_FACET,
                action,
                [
                    OwnershipFacet.transferOwnership.selector,
                    OwnershipFacet.owner.selector
                ]
            )],
            IDiamondCut.Args(owner)
        )
    {}

    /**
    TODO: maybe better  place to store this? Pretty sure this is only available to
    Functions defined in the same contract (i.e. main contract of Domain or Diamond logic).
    I think facets don't have access to consts on the contracts they get delegate called from.
   */

    modifier entry {
        s_Domain.Layout storage layout = s_Domain.get();
        require(layout.notEntered, Errors.RE_ENTRANCY);
        layout.notEntered = false;
        _;
        layout.notEndered = true;
    }

    modifier whenNotPaused {
        require(!_isPaused(), "PLATFORM_IS_PAUSED");
        _;
    }

    /**
      NOTE:: we can know the address of the protocol contract at all times
      Because the initial deployment is byteCode + deployerAddress + salt.
     */

    /**
        Actually calls into the access control facet of the protocol contract.
     */
    modifier only(Roles role, address account) {
        require(
            i_AccessControl(PROTOCOL).hasRole(role, account, address(this)),
            Errors.UNAUTHORIZED
        );
        _;
    }
}
