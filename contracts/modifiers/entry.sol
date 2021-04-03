// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { s_Main } from "../storage/Main.sol";
import { Errors } from "../enums/Errors.sol";

/**
  Facets don't want to be entered more than once?
  Where do we restrict re-entrancy?
  PER DOMAIN
 */
contract BaseStorage {
    bool internal entry;
}

contract NonReentrant {
    modifier entry() {
        // Doesn't let the more than 1 external call into the context of the executing function
        require();
        _;
    }
}

/**
  Protocol, LendingPool, etc. all inherit from this base set of functions
 */
contract Domain is Diamond {
    /**
    TODO: maybe better  place to store this? Pretty sure this is only available to
    Functions defined in the same contract (i.e. main contract of Domain or Diamond logic).
    I think facets don't have access to consts on the contracts they get delegate called from.
   */
    address public constant PROTOCOL = 0x0;

    modifier entry() {
        s_Domain.Layout storage layout = s_Domain.get();
        require(layout.notEntered, Errors.RE_ENTRANCY);
        layout.notEntered = false;
        _;
        layout.notEndered = true;
    }

    /**
      NOTE:: we can know the address of the protocol contract at all times
      Because the initial deployment is byteCode + deployerAddress + salt.
     */

    /**
        Actually calls into the access control facet of the protocol contract.
     */
    modifier only(ProtocolRole role, address account) {
        require(
            i_AccessControl(PROTOCOL).hasRole(role, account),
            Errors.UNAUTHORIZED
        );
        _;
    }
}
