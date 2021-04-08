// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { OwnerLib } from "./OwnerLib.sol";

abstract contract OwnerMods {
    modifier onlyOwner(address addr) {
        require(
            OwnerLib.ownerOf(addr) == msg.sender,
            "AccessControl: not owner"
        );
        _;
    }
}
