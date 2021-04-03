// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { LibDiamond } from "../diamond/libraries/LibDiamond.sol";
import { BaseDomain } from "./BaseDomain.sol";
import { Roles } from "../../enums/Roles.sol";
import { Errors } from "../../enums/Errors.sol";
import { s_Domain } from "../../storage/Domain.sol";

contract Domain is BaseDomain {
    /** Keep ref to main protocol contract address */
    address public immutable PROTOCOL;

    constructor(address protocol) BaseDomain(msg.sender) {
        PROTOCOL = protocol;
        LibDiamond.diamondCut();
    }

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
        s_Domain.Layout storage layout = s_Domain.get();
        require(!layout.paused, Errors.PAUSED);
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
