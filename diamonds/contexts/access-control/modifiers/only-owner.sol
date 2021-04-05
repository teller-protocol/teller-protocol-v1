// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../storage/owner.sol";

abstract contract mod_onlyOwner_AccessControl_v1 {
    modifier onlyOwner() {
        require(
            sto_AccessControl_Owner.accessControlOwnerStore().owner ==
                msg.sender,
            "AccessControl: not owner"
        );
        _;
    }
}

abstract contract mod_onlyOwner_AccessControl is
    mod_onlyOwner_AccessControl_v1
{}
