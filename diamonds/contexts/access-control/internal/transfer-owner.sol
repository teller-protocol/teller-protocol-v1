// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../data.sol";
import "../storage/owner.sol";

abstract contract int_transferOwner_AccessControl_v1 is dat_AccessControl {
    function _transferOwner(address owner) internal {
        require(
            sto_AccessControl_Owner.accessControlOwnerStore().owner ==
                msg.sender,
            "AccessControl: cannot transfer; not owner"
        );
        sto_AccessControl_Owner.accessControlOwnerStore().owner = owner;
        emit OwnerTransferred(owner, msg.sender);
    }
}

abstract contract int_transferOwner_AccessControl is
    int_transferOwner_AccessControl_v1
{}
