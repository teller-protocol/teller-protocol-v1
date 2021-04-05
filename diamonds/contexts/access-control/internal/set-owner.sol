// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../data.sol";
import "../storage/owner.sol";

abstract contract int_setOwner_AccessControl_v1 is dat_AccessControl {
    function _setOwner(address owner) internal {
        require(
            sto_AccessControl_Owner.accessControlOwnerStore().owner ==
                address(0),
            "AccessControl: owner already set"
        );
        sto_AccessControl_Owner.accessControlOwnerStore().owner = owner;
        emit OwnerSet(owner);
    }
}

abstract contract int_setOwner_AccessControl is int_setOwner_AccessControl_v1 {}
