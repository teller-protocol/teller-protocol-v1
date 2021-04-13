// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { MarketStorageLib, LendingPool } from "../../storage/market.sol";
import { NumbersLib } from "../../shared/libraries/NumbersLib.sol";
import { AppStorageLib } from "../../storage/app.sol";
import {
    SafeERC20
} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

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

    /**
        @notice It allows a borrower to repay their loan or a liquidator to liquidate a loan.
        @dev It requires a ERC20.approve call before calling it. (Does it though with diamonds?)
        @dev It throws a require error if borrower called ERC20.approve function before calling it.
        @param loanID The id of the loan being repaid or liquidated.
        @param principalAmount amount of tokens towards the principal.
        @param interestAmount amount of tokens towards the interest.
        @param sender address that is repaying the loan.
     */
    function repay(
        uint256 loanID,
        uint256 principalAmount,
        uint256 interestAmount,
        address sender
    ) internal {
        uint256 totalAmount = principalAmount + interestAmount;
        require(totalAmount > 0, "REPAY_ZERO");

        address lendingToken =
            MarketStorageLib.marketStore().loans[loanID].lendingToken;
        // Transfers tokens to LendingPool.
        tokenTransferFrom(sender, totalAmount, lendingToken);

        LendingPool storage lendingPool =
            MarketStorageLib.marketStore().lendingPool[lendingToken];

        lendingPool.totalRepaid = lendingPool.totalRepaid + principalAmount;
        lendingPool.totalInterestEarned =
            lendingPool.totalInterestEarned +
            interestAmount;

        depositToCompoundIfSupported(lendingToken, totalAmount);
    }

    /**
        @notice It deposits a given amount of tokens to Compound.
        @dev The cToken address must be defined in AssetSettings.
        @dev The underlying token value of the tokens to be deposited must be positive. Because the decimals of
            cTokens and the underlying asset can differ, the deposit of dust tokens may result in no cTokens minted.
        @param amount The amount of underlying tokens to deposit.
        @return difference The amount of underlying tokens deposited.
     */
    function depositToCompoundIfSupported(address lendingToken, uint256 amount)
        internal
        returns (uint256 difference)
    {
        LendingPool storage lendingPool =
            MarketStorageLib.marketStore().lendingPool[lendingToken];

        if (address(lendingPool.cToken) == address(0)) {
            return 0;
        }

        // approve the cToken contract to take lending tokens
        SafeERC20.safeApprove(
            IERC20(lendingToken),
            address(lendingPool.cToken),
            amount
        );

        uint256 balanceBefore =
            lendingPool.lendingToken.balanceOf(address(this));

        // Now mint cTokens, which will take lending tokens
        uint256 mintResult = lendingPool.cToken.mint(amount);
        require(mintResult == 0, "COMPOUND_DEPOSIT_ERROR");

        uint256 balanceAfter =
            lendingPool.lendingToken.balanceOf(address(this));
        difference = balanceBefore - (balanceAfter);
        require(difference > 0, "DEPOSIT_CTOKEN_DUST");
    }

    /**
        @notice It transfers an amount of tokens from an address to this contract.
        @param from address where the tokens will transfer from.
        @param amount to be transferred.
        @param lendingToken the address of the lending token
        @dev It throws a require error if 'transferFrom' invocation fails.
     */
    function tokenTransferFrom(
        address from,
        uint256 amount,
        address lendingToken
    ) private returns (uint256 balanceIncrease) {
        uint256 balanceBefore = IERC20(lendingToken).balanceOf(address(this));
        SafeERC20.safeTransferFrom(
            IERC20(lendingToken),
            from,
            address(this),
            amount
        );
        return IERC20(lendingToken).balanceOf(address(this)) - (balanceBefore);
    }
}
