// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Libraries
import { MarketStorageLib } from "../storage/market.sol";
import { LendingLib } from "../lending/libraries/LendingLib.sol";

abstract contract DappMods {
    modifier onlyBorrower(uint256 loanID) {
        require(
            msg.sender ==
                MarketStorageLib.store().loans[loanID].loanTerms.borrower
        );
        _;
    }
}
