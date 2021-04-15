// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Libraries
import { NumbersLib } from "../../shared/libraries/NumbersLib.sol";
import {
    SafeERC20
} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import { CompoundLib } from "../../shared/libraries/CompoundLib.sol";

// Interfaces
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

// Storage
import { LendingStorageLib, LendingStorage } from "../../storage/lending.sol";
import { AppStorageLib } from "../../storage/app.sol";
import { MarketStorageLib, LendingPool } from "../../storage/market.sol";
import { PriceAggLib } from "../../price-aggregator/PriceAggLib.sol";

library LendingLib {
    using NumbersLib for uint256;

    function s(address asset) internal pure returns (LendingStorage storage) {
        return LendingStorageLib.store(asset);
    }

    uint256 internal constant EXCHANGE_RATE_FACTOR = 1e18;

    /**
     * @dev
     */
    function tTokenValue(uint256 assetAmount, uint256 exchangeRate)
        internal
        pure
        returns (uint256 value_)
    {
        value_ = (assetAmount * EXCHANGE_RATE_FACTOR) / exchangeRate;
    }

    /**
     * @dev
     */
    function assetValue(uint256 tTokenAmount, uint256 exchangeRate)
        internal
        pure
        returns (uint256 value_)
    {
        value_ = (tTokenAmount * (exchangeRate)) / EXCHANGE_RATE_FACTOR;
    }

    /**
     * @dev
     */
    function exchangeRateSupply(address asset)
        internal
        view
        returns (uint256 rate_, uint256 supply_)
    {
        if (tToken.totalSupply() == 0) {
            return EXCHANGE_RATE_FACTOR;
        }

        supply_ = totalSupplied(asset);
        rate_ = exchangeRateForSupply(asset, supply);
    }

    /**
     * @dev
     */
    function exchangeRate(address asset) internal view returns (uint256 rate_) {
        if (tToken.totalSupply() == 0) {
            return EXCHANGE_RATE_FACTOR;
        }

        rate_ = exchangeRateForSupply(asset, totalSupplied(asset));
    }

    /**
     * @dev
     */
    function exchangeRateForSupply(address asset, uint256 supply)
        internal
        view
        returns (uint256 rate_)
    {
        rate_ = (supply * EXCHANGE_RATE_FACTOR) / tToken.totalSupply();
    }

    /**
     * @dev
     */
    function exchangeRateCurrentSupply(address asset)
        internal
        returns (uint256 rate_, uint256 supply_)
    {
        accrueInterest(asset);
        (rate_, supply_) = exchangeRateSupply(asset);
    }

    /**
     * @dev
     */
    function exchangeRateCurrent(address asset)
        internal
        returns (uint256 rate_)
    {
        accrueInterest(asset);
        rate_ = exchangeRate(asset);
    }

    /**
     * @dev
     */
    function accrueInterest(address asset) internal {
        // TODO: Accrue interest for secondary LP assets
    }

    /**
     * @notice It calculates the total supply of the lending asset across all markets.
     * @return totalSupplied the total supply denoted in the lending asset.
     */
    function totalSupplied(address asset)
        internal
        view
        returns (uint256 totalSupplied_)
    {
        totalSupplied_ =
            ERC20(asset).balanceOf(address(this)) +
            s(asset).totalBorrowed -
            s(asset).totalRepaid;

        for (uint256 i; i < store.secondaryFunds.length(); i++) {
            address otherToken = store.secondaryFunds.at(i);
            totalSupplied_ += PriceAggLib.valueFor(
                otherToken,
                asset,
                // TODO: replace with funding escrow
                ERC20(otherToken).balanceOf(address(this))
            );
        }
    }

    function lenderInterestEarned(
        address asset,
        uint256 rate,
        address lender
    ) internal view returns (uint256 interest_) {
        interest_ =
            assetValue(tToken.balanceOf(lender), rate) -
            s(asset).lenderTotalSupplied[lender];
    }

    /**
     * @notice It validates whether supply to debt (StD) ratio is valid including the loan amount.
     * @param newLoanAmount the new loan amount to consider o the StD ratio.
     * @return true if the ratio is valid. Otherwise it returns false.
     */
    function debtRatioFor(address asset, uint256 newLoanAmount)
        internal
        view
        returns (uint256 ratio_)
    {
        // NOTE: potentially costly function
        uint256 supplied = totalSupplied(asset);
        if (supplied > 0) {
            uint256 newOnLoanAmount =
                s(asset).totalBorrowed - s(asset).totalRepaid + newLoanAmount;
            ratio_ = newOnLoanAmount.ratioOf(supplied);
        }
    }

    /**
     * @notice It withdraws a given amount of tokens from Compound.
     * @param amount The amount of underlying tokens to withdraw.
     * @return The amount of underlying tokens withdrawn.
     */
    function withdrawFromCompoundIfSupported(address asset, uint256 amount)
        internal
        returns (uint256)
    {
        if (address(s(asset).cToken) == address(0)) {
            return 0;
        }

        uint256 balanceBefore = s(asset).asset.balanceOf(address(this));

        uint256 redeemResult = s(asset).cToken.redeemUnderlying(amount);
        require(redeemResult == 0, "COMPOUND_REDEEM_UNDERLYING_ERROR");

        uint256 balanceAfter = s(asset).asset.balanceOf(address(this));
        return balanceAfter - (balanceBefore);
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

        address asset = MarketStorageLib.store().loans[loanID].asset;
        // Transfers tokens to LendingPool.
        tokenTransferFrom(sender, totalAmount, asset);

        s(asset).totalRepaid = s(asset).totalRepaid + principalAmount;
        s(asset).totalInterestEarned =
            s(asset).totalInterestEarned +
            interestAmount;

        depositToCompoundIfSupported(asset, totalAmount);
    }

    /**
     * @notice It deposits a given amount of tokens to Compound.
     * @dev The cToken address must be defined in AssetSettings.
     * @dev The underlying token value of the tokens to be deposited must be positive. Because the decimals of
            cTokens and the underlying asset can differ, the deposit of dust tokens may result in no cTokens minted.
     * @param amount The amount of underlying tokens to deposit.
     * @return difference The amount of underlying tokens deposited.
     */
    function depositToCompoundIfSupported(address asset, uint256 amount)
        internal
        returns (uint256 difference)
    {
        if (address(s(asset).cToken) == address(0)) {
            return 0;
        }

        // approve the cToken contract to take lending tokens
        SafeERC20.safeApprove(IERC20(asset), address(s(asset).cToken), amount);

        uint256 balanceBefore = s(asset).asset.balanceOf(address(this));

        // Now mint cTokens, which will take lending tokens
        uint256 mintResult = s(asset).cToken.mint(amount);
        require(mintResult == 0, "COMPOUND_DEPOSIT_ERROR");

        uint256 balanceAfter = s(asset).asset.balanceOf(address(this));
        difference = balanceBefore - (balanceAfter);
        require(difference > 0, "DEPOSIT_CTOKEN_DUST");
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
