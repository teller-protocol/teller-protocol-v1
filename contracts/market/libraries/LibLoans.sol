// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Interfaces
import { IEscrow } from "../../shared/interfaces/IEscrow.sol";

// Libraries
import { NumbersLib } from "../../shared/libraries/NumbersLib.sol";
import {
    PlatformSettingsLib
} from "../../settings/platform/PlatformSettingsLib.sol";
import { PriceAggLib } from "../../price-aggregator/PriceAggLib.sol";

// Storage
import {
    MarketStorageLib,
    MarketStorage,
    LoanStatus
} from "../../storage/market.sol";
import { AppStorageLib } from "../../storage/app.sol";

library LibLoans {
    using NumbersLib for int256;
    using NumbersLib for uint256;

    function s() private pure returns (MarketStorage storage) {
        return MarketStorageLib.store();
    }

    /**
     * @notice Returns the total amount owed for a specified loan.
     * @param loanID The loan ID to get the total amount owed.
     * @return uint256 The total owed amount.
     */
    function getTotalOwed(uint256 loanID) public view returns (uint256) {
        if (s().loans[loanID].status == LoanStatus.TermsSet) {
            uint256 interestOwed =
                getInterestOwedFor(
                    loanID,
                    s().loans[loanID].loanTerms.maxLoanAmount
                );
            return s().loans[loanID].loanTerms.maxLoanAmount + (interestOwed);
        } else if (s().loans[loanID].status == LoanStatus.Active) {
            return
                s().loans[loanID].principalOwed +
                (s().loans[loanID].interestOwed);
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
        public
        view
        returns (uint256)
    {
        return amountBorrow.percent(getInterestRatio(loanID));
    }

    function getCollateralNeededInfo(uint256 loanID)
        public
        view
        returns (
            int256 neededInLendingTokens,
            int256 neededInCollateralTokens,
            uint256 escrowLoanValue
        )
    {
        (neededInLendingTokens, escrowLoanValue) = getCollateralNeededInTokens(
            loanID
        );

        if (neededInLendingTokens == 0) {
            neededInCollateralTokens = 0;
        } else {
            uint256 value =
                PriceAggLib.valueFor(
                    s().loans[loanID].lendingToken,
                    s().loans[loanID].collateralToken,
                    uint256(
                        neededInLendingTokens < 0
                            ? -neededInLendingTokens
                            : neededInLendingTokens
                    )
                );
            neededInCollateralTokens = int256(value);
            if (neededInLendingTokens < 0) {
                neededInCollateralTokens = neededInCollateralTokens * -1;
            }
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
        returns (int256 neededInLendingTokens, uint256 escrowLoanValue)
    {
        if (
            !_isActiveOrSet(loanID) ||
            s().loans[loanID].loanTerms.collateralRatio == 0
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
        if (s().loans[loanID].status == LoanStatus.TermsSet) {
            neededInLendingTokens = int256(_getLoanAmount(loanID)).percent(
                s().loans[loanID].loanTerms.collateralRatio
            );
        } else {
            neededInLendingTokens = int256(s().loans[loanID].principalOwed);
            uint256 requiredRatio =
                s().loans[loanID].loanTerms.collateralRatio -
                    getInterestRatio(loanID) -
                    PlatformSettingsLib.getCollateralBufferValue();
            if (s().escrows[loanID] != address(0)) {
                escrowLoanValue = IEscrow(s().escrows[loanID])
                    .calculateTotalValue();
                //            if (s().loans[loanID].escrow != address(0)) {
                //                escrowLoanValue = IEscrow(s().loans[loanID].escrow)
                //                    .calculateTotalValue();
                neededInLendingTokens =
                    neededInLendingTokens +
                    (neededInLendingTokens - int256(escrowLoanValue));
            }
            neededInLendingTokens =
                neededInLendingTokens +
                (int256(s().loans[loanID].interestOwed)).percent(requiredRatio);
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
     * @notice It checks if a loan can be liquidated.
     * @param loanID The loan ID to check.
     * @return true if the loan is liquidable.
     */
    function isLiquidable(uint256 loanID) public view returns (bool) {
        // Check if loan can be liquidated
        if (s().loans[loanID].status != LoanStatus.Active) {
            return false;
        }

        if (s().loans[loanID].loanTerms.collateralRatio > 0) {
            // If loan has a collateral ratio, check how much is needed
            (, int256 neededInCollateral, ) = getCollateralNeededInfo(loanID);
            return neededInCollateral > int256(s().loans[loanID].collateral);
        } else {
            // Otherwise, check if the loan has expired
            return
                block.timestamp >=
                s().loans[loanID].loanStartTime +
                    (s().loans[loanID].loanTerms.duration);
        }
    }

    /**
     * @notice It gets the current liquidation reward for a given loan.
     * @param loanID The loan ID to get the info.
     * @return The value the liquidator will receive denoted in collateral tokens.
     */
    function getLiquidationReward(uint256 loanID) public view returns (int256) {
        uint256 amountToLiquidate = getTotalOwed(loanID);
        uint256 availableValue =
            getCollateralInLendingTokens(loanID) +
                (IEscrow(s().escrows[loanID]).calculateTotalValue());
        uint256 maxReward =
            amountToLiquidate.percent(
                PlatformSettingsLib
                    .getLiquidateEthPriceValue()
                    .diffOneHundredPercent()
            );
        if (availableValue < amountToLiquidate + maxReward) {
            return int256(availableValue);
        } else {
            return int256(maxReward) + (int256(amountToLiquidate));
        }
    }

    /**
     * @notice Returns the collateral needed for a loan, in the lending token, needed to take out the loan or for it be liquidated.
     * @param loanID The loan ID for which to get collateral information for
     * @return uint256 Collateral needed in lending token value
     */
    function getCollateralInLendingTokens(uint256 loanID)
        public
        view
        returns (uint256)
    {
        if (!_isActiveOrSet(loanID)) {
            return 0;
        }
        return
            PriceAggLib.valueFor(
                s().loans[loanID].collateralToken,
                s().loans[loanID].lendingToken,
                s().loans[loanID].collateral
            );
    }

    /**
     * @notice Returns the interest ratio based on the loan interest rate for the loan duration.
     * @dev The interest rate on the loan terms is APY.
     * @param loanID The loan ID to get the interest rate for.
     */
    function getInterestRatio(uint256 loanID) internal view returns (uint256) {
        return
            (s().loans[loanID].loanTerms.interestRate *
                (s().loans[loanID].loanTerms.duration)) /
            //                .div(SECONDS_PER_YEAR); // change to new constants file once written
            (31536000);
    }

    function _getLoanAmount(uint256 loanID) private view returns (uint256) {
        if (s().loans[loanID].status == LoanStatus.TermsSet) {
            return s().loans[loanID].loanTerms.maxLoanAmount;
        } else if (s().loans[loanID].status == LoanStatus.Active) {
            return s().loans[loanID].borrowedAmount;
        }
        return 0;
    }

    function _isActiveOrSet(uint256 loanID) private view returns (bool) {
        LoanStatus status = s().loans[loanID].status;
        return status == LoanStatus.Active || status == LoanStatus.TermsSet;
    }
}
