// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Libraries
import { LibEscrow } from "../../escrow/libraries/LibEscrow.sol";
import { NumbersLib } from "../../shared/libraries/NumbersLib.sol";
import {
    PlatformSettingsLib
} from "../../settings/platform/PlatformSettingsLib.sol";
import { PriceAggLib } from "../../price-aggregator/PriceAggLib.sol";

// Storage
import {
    MarketStorageLib,
    MarketStorage,
    Loan,
    LoanStatus
} from "../../storage/market.sol";

library LibLoans {
    using NumbersLib for int256;
    using NumbersLib for uint256;

    function s() internal pure returns (MarketStorage storage) {
        return MarketStorageLib.store();
    }

    function loan(uint256 loanID) internal view returns (Loan storage l_) {
        l_ = s().loans[loanID];
    }

    /**
     * @notice Returns the total amount owed for a specified loan.
     * @param loanID The loan ID to get the total amount owed.
     * @return uint256 The total owed amount.
     */
    function getTotalOwed(uint256 loanID) internal view returns (uint256) {
        if (loan(loanID).status == LoanStatus.TermsSet) {
            uint256 interestOwed =
                getInterestOwedFor(
                    loanID,
                    loan(loanID).loanTerms.maxLoanAmount
                );
            return loan(loanID).loanTerms.maxLoanAmount + (interestOwed);
        } else if (loan(loanID).status == LoanStatus.Active) {
            return loan(loanID).principalOwed + (loan(loanID).interestOwed);
        }
        return 0;
    }

    /**
     * @notice Returns the amount of interest owed for a given loan and loan amount.
     * @param loanID The loan ID to get the owed interest.
     * @param amountBorrow The principal of the loan to take out.
     * @return uint256 The interest owed.
     */
    function getInterestOwedFor(uint256 loanID, uint256 amountBorrow)
        internal
        view
        returns (uint256)
    {
        return amountBorrow.percent(getInterestRatio(loanID));
    }

    function getCollateralNeededInfo(uint256 loanID)
        internal
        view
        returns (
            uint256 neededInLendingTokens,
            uint256 neededInCollateralTokens,
            uint256 escrowLoanValue
        )
    {
        (neededInLendingTokens, escrowLoanValue) = getCollateralNeededInTokens(
            loanID
        );

        if (neededInLendingTokens == 0) {
            neededInCollateralTokens = 0;
        } else {
            neededInCollateralTokens = PriceAggLib.valueFor(
                loan(loanID).lendingToken,
                loan(loanID).collateralToken,
                neededInLendingTokens
            );
        }
    }

    /**
     * @notice Returns the minimum collateral value threshold, in the lending token, needed to take out the loan or for it be liquidated.
     * @dev If the loan status is TermsSet, then the value is whats needed to take out the loan.
     * @dev If the loan status is Active, then the value is the threshold at which the loan can be liquidated at.
     * @param loanID The loan ID to get needed collateral info for.
     * @return neededInLendingTokens int256 The minimum collateral value threshold required.
     * @return escrowLoanValue uint256 The value of the loan held in the escrow contract.
     */
    function getCollateralNeededInTokens(uint256 loanID)
        internal
        view
        returns (uint256 neededInLendingTokens, uint256 escrowLoanValue)
    {
        if (
            !_isActiveOrSet(loanID) ||
            loan(loanID).loanTerms.collateralRatio == 0
        ) {
            return (0, 0);
        }

        /*
            The collateral to principal owed ratio is the sum of:
                * collateral buffer percent
                * loan interest rate
                * liquidation reward percent
                * X factor of additional collateral
        */
        // * To take out a loan (if status == TermsSet), the required collateral is (max loan amount * the collateral ratio).
        // * For the loan to not be liquidated (when status == Active), the minimum collateral is (principal owed * (X collateral factor + liquidation reward)).
        // * If the loan has an escrow account, the minimum collateral is ((principal owed - escrow value) * (X collateral factor + liquidation reward)).
        if (loan(loanID).status == LoanStatus.TermsSet) {
            neededInLendingTokens = _getLoanAmount(loanID).percent(
                loan(loanID).loanTerms.collateralRatio
            );
        } else {
            uint256 requiredRatio =
                loan(loanID).loanTerms.collateralRatio -
                    getInterestRatio(loanID) -
                    PlatformSettingsLib.getCollateralBufferValue();

            neededInLendingTokens =
                loan(loanID).principalOwed +
                loan(loanID).interestOwed;
            escrowLoanValue = LibEscrow.calculateTotalValue(loanID);
            if (
                escrowLoanValue > 0 && neededInLendingTokens > escrowLoanValue
            ) {
                neededInLendingTokens -= escrowLoanValue;
            }
            neededInLendingTokens = neededInLendingTokens.percent(
                requiredRatio
            );
        }
    }

    function canGoToEOAWithCollateralRatio(uint256 collateralRatio)
        internal
        view
        returns (bool)
    {
        return
            collateralRatio >=
            PlatformSettingsLib.getOverCollateralizedBufferValue();
    }

    /**
     * @notice Returns the interest ratio based on the loan interest rate for the loan duration.
     * @dev The interest rate on the loan terms is APY.
     * @param loanID The loan ID to get the interest rate for.
     */
    function getInterestRatio(uint256 loanID) internal view returns (uint256) {
        return
            (loan(loanID).loanTerms.interestRate *
                (loan(loanID).loanTerms.duration)) /
            //                .div(SECONDS_PER_YEAR); // change to new constants file once written
            (31536000);
    }

    function _getLoanAmount(uint256 loanID) private view returns (uint256) {
        if (loan(loanID).status == LoanStatus.TermsSet) {
            return loan(loanID).loanTerms.maxLoanAmount;
        } else if (loan(loanID).status == LoanStatus.Active) {
            return loan(loanID).borrowedAmount;
        }
        return 0;
    }

    function _isActiveOrSet(uint256 loanID) private view returns (bool) {
        LoanStatus status = loan(loanID).status;
        return status == LoanStatus.Active || status == LoanStatus.TermsSet;
    }

    /**
        @notice It calculates the market state values across a given markets.
        @notice Returns values that represent the global state across the market.
        @param lendingToken The address of the asset.
        @return totalSupplied Total amount of the underlying asset supplied.
        @return totalBorrowed Total amount borrowed through loans.
        @return totalRepaid The total amount repaid till the current timestamp.
        @return totalOnLoan Total amount currently deployed in loans.
     */
    function getMarketState(address lendingToken)
        internal
        returns (
            uint256 totalSupplied,
            uint256 totalBorrowed,
            uint256 totalRepaid,
            uint256 totalOnLoan
        )
    {
        totalSupplied = s().tTokens[lendingToken].totalUnderlyingSupply();
        totalBorrowed = s().totalBorrowed[lendingToken];
        totalRepaid = s().totalRepaid[lendingToken];
        totalOnLoan = totalBorrowed - (totalRepaid);
    }
}
