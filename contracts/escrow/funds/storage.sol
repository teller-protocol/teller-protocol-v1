// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {
    EnumerableSet
} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import { FundsEscrow } from "./FundsEscrow.sol";

struct FundsEscrowStorage {
    address implementation;
    mapping(address => FundsEscrow) assetEscrow;
    EnumerableSet.AddressSet escrows;
}

bytes32 constant FUNDS_ESCROW_STORAGE_POS = keccak256(
    "teller.funds_escrow.storage"
);

library FundsEscrowStorageLib {
    function store() internal pure returns (FundsEscrowStorage storage s) {
        bytes32 pos = FUNDS_ESCROW_STORAGE_POS;
        assembly {
            s.slot := pos
        }
    }
}
