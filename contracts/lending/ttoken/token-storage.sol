// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

struct Store {
    // The underlying asset of the tToken
    ERC20 underlying;
    // The address of the investment strategy contract managing the underlying assets
    address strategy;
    // The total amount of the underlying asset currently out in disbursed loans
    uint256 totalBorrowed;
    // The total amount of the underlying asset currently repaid from disbursed loans
    uint256 totalRepaid;
    // The total amount of the underlying asset currently repaid in the form of interest owed from disbursed loans
    uint256 totalInterestRepaid;
    // The decimals of the underlying ERC20 asset
    uint8 decimals;
    // The status of token investment restriction
    bool restricted; // DEPRECATED
    // The wrapped native token address
    bool isWrappedNative;
}

bytes32 constant POSITION = keccak256("ttoken.storage.position");

/**
 * @notice it saves the Store struct in a hashed slot
 */
function store() pure returns (Store storage s_) {
    bytes32 position = POSITION;
    assembly {
        s_.slot := position
    }
}
