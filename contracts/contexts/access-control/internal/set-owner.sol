// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { AccessControlEvents } from "../data.sol";
import "../storage/owner.sol";

abstract contract int_setOwner_AccessControl_v1 is sto_AccessControl_Owner {
    function _setOwner(address owner) internal {
        require(
            accessControlOwnerStore().owner == address(0),
            "AccessControl: owner already set"
        );
        accessControlOwnerStore().owner = owner;
        emit AccessControlEvents.OwnerSet(owner);
    }
}
