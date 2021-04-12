// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { MarketStorageLib, LendingPool } from "../../storage/market.sol";
import { NumbersLib } from "../../shared/libraries/NumbersLib.sol";
import { AppStorageLib } from "../../storage/app.sol";

library LibLendingPool {
    using NumbersLib for uint256;

    function getDebtRatioFor(address lendingToken, uint256 newLoanAmount)
        internal
        view
        returns (uint256)
    {
        LendingPool storage lendingPool =
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

    /**
     * @notice It validates whether supply to debt (StD) ratio is valid including the loan amount.
     * @param newLoanAmount the new loan amount to consider o the StD ratio.
     * @return true if the ratio is valid. Otherwise it returns false.
     */
    function isDebtRatioValid(address lendingToken, uint256 newLoanAmount)
        internal
        view
        returns (bool)
    {
        return
            getDebtRatioFor(lendingToken, newLoanAmount) <=
            AppStorageLib.store().assetSettings[lendingToken].uints[
                keccak256("MaxDebtRatio")
            ];
    }

    /**
        @notice It withdraws a given amount of tokens from Compound.
        @param amount The amount of underlying tokens to withdraw.
        @return The amount of underlying tokens withdrawn.
     */
    function withdrawFromCompoundIfSupported(
        address lendingToken,
        uint256 amount
    ) internal returns (uint256) {
        LendingPool storage lendingPool =
            MarketStorageLib.marketStore().lendingPool[lendingToken];

        if (address(lendingPool.cToken) == address(0)) {
            return 0;
        }

        uint256 balanceBefore =
            lendingPool.lendingToken.balanceOf(address(this));

        uint256 redeemResult = lendingPool.cToken.redeemUnderlying(amount);
        require(redeemResult == 0, "COMPOUND_REDEEM_UNDERLYING_ERROR");

        uint256 balanceAfter =
            lendingPool.lendingToken.balanceOf(address(this));
        return balanceAfter - (balanceBefore);
    }
}
