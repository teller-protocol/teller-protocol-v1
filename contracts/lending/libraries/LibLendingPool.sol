// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { MarketStorageLib, LendingPool } from "../../storage/market.sol";
import { NumbersLib } from "../../shared/libraries/NumbersLib.sol";

library LibLendingPool {
    using NumbersLib for uint256;

    function getDebtRatioFor(address lendingToken, uint256 newLoanAmount)
        external
        view
        returns (uint256)
    {
        LendingPool memory lendingPool =
            MarketStorageLib.marketStore().lendingPool[lendingToken];
        uint256 totalSupplied = lendingPool.totalSupplied;

        return
            totalSupplied == 0
                ? 0
                : (lendingPool.totalBorrowed +
                    newLoanAmount -
                    lendingPool.totalRepaid)
                    .ratioOf(totalSupplied);
    }
}
