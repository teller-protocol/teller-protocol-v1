// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Libraries
import { NumbersLib } from "../../shared/libraries/NumbersLib.sol";
import {
    SafeERC20
} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import { PriceAggLib } from "../../price-aggregator/PriceAggLib.sol";
import { CompoundLib } from "../../shared/libraries/CompoundLib.sol";
import {
    EnumerableSet
} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import { AssetCTokenLib } from "../../settings/asset/AssetCTokenLib.sol";

// Interfaces
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

// Storage
import { MarketStorageLib, MarketStorage } from "../../storage/market.sol";

library LendingLib {
    function s() internal view returns (MarketStorage storage) {
        return MarketStorageLib.store();
    }

    /**
     * @notice It validates whether supply to debt (StD) ratio is valid including the loan amount.
     * @param newLoanAmount the new loan amount to consider o the StD ratio.
     * @return ratio_ Whether debt ratio for lending pool is valid.
     */
    function debtRatioFor(address asset, uint256 newLoanAmount)
        internal
        view
        returns (uint256 ratio_)
    {
        uint256 supplied = s().tTokens[asset].totalUnderlyingSupply();
        if (supplied > 0) {
            uint256 newOnLoanAmount =
                s().totalBorrowed[asset] -
                    s().totalRepaid[asset] +
                    newLoanAmount;
            ratio_ = NumbersLib.ratioOf(newOnLoanAmount, supplied);
        }
    }

    /**
     * @notice It allows a borrower to repay their loan or a liquidator to liquidate a loan.
     * @dev It requires a ERC20.approve call before calling it. (Does it though with diamonds?)
     * @dev It throws a require error if borrower called ERC20.approve function before calling it.
     * @param loanID The id of the loan being repaid or liquidated.
     * @param principalAmount amount of tokens towards the principal.
     * @param interestAmount amount of tokens towards the interest.
     * @param sender address that is repaying the loan.
     */
    function repay(
        uint256 loanID,
        uint256 principalAmount,
        uint256 interestAmount,
        address sender
    ) internal {
        uint256 totalAmount = principalAmount + interestAmount;
        require(totalAmount > 0, "REPAY_ZERO");

        address asset = MarketStorageLib.store().loans[loanID].lendingToken;
        // Transfers tokens to LendingPool.
        tokenTransferFrom(sender, totalAmount, asset);

        s().totalRepaid[asset] += principalAmount;
        s().totalInterestRepaid[asset] += interestAmount;
    }

    /**
     * @notice It transfers an amount of tokens from an address to this contract.
     * @param from address where the tokens will transfer from.
     * @param amount to be transferred.
     * @param asset the address of the lending token
     * @dev It throws a require error if 'transferFrom' invocation fails.
     */
    function tokenTransferFrom(
        address from,
        uint256 amount,
        address asset
    ) private returns (uint256 balanceIncrease) {
        uint256 balanceBefore = IERC20(asset).balanceOf(address(this));
        SafeERC20.safeTransferFrom(IERC20(asset), from, address(this), amount);
        return IERC20(asset).balanceOf(address(this)) - (balanceBefore);
    }
}
