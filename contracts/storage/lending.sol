// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Interfaces
import { ILendingEscrow } from "../lending/escrow/ILendingEscrow.sol";
import { ITToken } from "../shared/interfaces/ITToken.sol";

// Libraries
import {
    EnumerableSet
} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

struct LendingStorage {
    ILendingEscrow escrow;
    EnumerableSet.AddressSet secondaryFunds;
    uint256 totalBorrowed;
    uint256 totalRepaid;
    uint256 totalInterestEarned;
    mapping(address => uint256) lenderTotalSupplied;
    mapping(address => uint256) lenderTotalInterest;
    ITToken tToken;
    //    address compound;
    //    address comp;
    //    uint256 totalCollateralInLendingTokens;
}

struct LendingMarkets {
    mapping(address => LendingStorage) lendingMarket;
}

bytes32 constant LENDING_MARKETS_STORAGE_POS = keccak256(
    "teller.lending.markets.storage"
);

library LendingStorageLib {
    function marketsStore() internal pure returns (LendingMarkets storage s) {
        bytes32 pos = LENDING_MARKETS_STORAGE_POS;
        assembly {
            s.slot := pos
        }
    }

    function store(address asset)
        internal
        view
        returns (LendingStorage storage s)
    {
        s = marketsStore().lendingMarket[asset];
    }
}
