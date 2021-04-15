// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import { ITToken } from "../shared/interfaces/ITToken.sol";
import {
    EnumerableSet
} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

struct LendingStorage {
    bool initialized;
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
    function marketsStore()
        internal
        view
        returns (LendingMarketsStorage storage s)
    {
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
        s = marketsStore().stores[asset];
    }
}
