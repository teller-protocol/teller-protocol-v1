// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import { ITToken } from "../shared/interfaces/ITToken.sol";

struct LendingStorage {
    uint256 tmp;
    mapping(string => address) addresses;
    mapping(address => uint256) totalSuppliedUnderlyingLender;
    mapping(address => uint256) totalInterestEarnedLender;
    ITToken tToken;
    ERC20 lendingToken;
    address cToken;
    address compound;
    address comp;
    uint256 totalBorrowed;
    uint256 totalRepaid;
    uint256 totalInterestEarned;
}

bytes32 constant LENDING_STORAGE_POS = keccak256("teller.lending.storage");

library LendingStorageLib {
    function store() internal pure returns (LendingStorage storage s) {
        bytes32 pos = LENDING_STORAGE_POS;
        assembly {
            s.slot := pos
        }
    }
}
