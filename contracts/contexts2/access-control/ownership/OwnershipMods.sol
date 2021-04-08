// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { OwnershipLib } from "./OwnershipLib.sol";

abstract contract OwnershipMods {
    modifier onlyOwner(address addr) {
        require(
            OwnershipLib.ownerOf(addr) == msg.sender,
            "AccessControl: not owner"
        );
        _;
    }
}
