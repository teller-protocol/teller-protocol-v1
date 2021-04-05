// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../storage/owner.sol";

abstract contract mod_onlyOwner_AccessControl_v1 is sto_AccessControl_Owner {
    modifier onlyOwner() {
        require(
            accessControlOwnerStore().owner == msg.sender,
            "AccessControl: not owner"
        );
        _;
    }
}

abstract contract mod_onlyOwner_AccessControl is
    mod_onlyOwner_AccessControl_v1
{}
